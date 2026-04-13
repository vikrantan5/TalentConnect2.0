from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, Depends
from app.database import get_db
from app.utils.auth import decode_access_token, get_current_user
from datetime import datetime, timezone
from typing import Dict
import logging
import uuid
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/realtime", tags=["Realtime"])


class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, room_key: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_key not in self.rooms:
            self.rooms[room_key] = {}
        self.rooms[room_key][user_id] = websocket

    def disconnect(self, room_key: str, user_id: str):
        room = self.rooms.get(room_key, {})
        if user_id in room:
            del room[user_id]
        if not room and room_key in self.rooms:
            del self.rooms[room_key]

    async def broadcast(self, room_key: str, message: dict):
        room = self.rooms.get(room_key, {})
        stale_users = []

        for uid, connection in room.items():
            try:
                await connection.send_json(message)
            except Exception:
                stale_users.append(uid)

        for uid in stale_users:
            self.disconnect(room_key, uid)


manager = ConnectionManager()


def _validate_room_type(room_type: str):
      if room_type not in ["task", "session", "exchange"]:
        raise HTTPException(status_code=400, detail="room_type must be 'task', 'session', or 'exchange'")


def _room_key(room_type: str, room_id: str) -> str:
    return f"{room_type}:{room_id}"


def _map_chat_type(room_type: str) -> str:
    """Map WebSocket room_type to exchange_chat_history chat_type"""
    mapping = {
        "task": "task",
        "exchange": "skill_exchange",
        "session": "session",
    }
    return mapping.get(room_type, room_type)


def _get_receiver_id(room_type: str, room_id: str, sender_id: str) -> str:
    """Look up the other participant in a task/exchange/session room"""
    try:
        db = get_db()

        if room_type == "task":
            task = db.table("tasks").select("creator_id, acceptor_id, assigned_user_id").eq("id", room_id).execute()
            if task.data:
                t = task.data[0]
                other = t.get("acceptor_id") or t.get("assigned_user_id")
                if sender_id == t.get("creator_id"):
                    return other or ""
                else:
                    return t.get("creator_id") or ""

        elif room_type == "exchange":
            exchange = db.table("skill_exchange_tasks").select("creator_id, matched_user_id").eq("id", room_id).execute()
            if exchange.data:
                e = exchange.data[0]
                if sender_id == e.get("creator_id"):
                    return e.get("matched_user_id") or ""
                else:
                    return e.get("creator_id") or ""

        elif room_type == "session":
            session = db.table("skill_exchange_sessions").select("participant1_id, participant2_id").eq("id", room_id).execute()
            if session.data:
                s = session.data[0]
                if sender_id == s.get("participant1_id"):
                    return s.get("participant2_id") or ""
                else:
                    return s.get("participant1_id") or ""
    except Exception as e:
        logger.warning(f"Could not resolve receiver_id: {e}")

    return None


def _persist_message(room_type: str, room_id: str, sender_id: str, content: str, meet_link: str = None):
    """Persist message to exchange_chat_history table"""
    db = get_db()
    receiver_id = _get_receiver_id(room_type, room_id, sender_id)
    chat_type = _map_chat_type(room_type)

    record = {
        "sender_id": sender_id,
        "message": content,
        "chat_type": chat_type,
        "reference_id": room_id,
    }
    if receiver_id:
        record["receiver_id"] = receiver_id
    if meet_link:
        record["meet_link"] = meet_link

    db.table("exchange_chat_history").insert(record).execute()


def _normalize_history_message(msg: dict, room_type: str, room_id: str) -> dict:
    """Normalize exchange_chat_history row to frontend-compatible format"""
    return {
        "id": msg.get("id"),
        "sender_id": msg.get("sender_id"),
        "receiver_id": msg.get("receiver_id"),
        "content": msg.get("message", ""),
        "message_type": "text",
        "chat_type": msg.get("chat_type"),
        "reference_id": msg.get("reference_id"),
        "meet_link": msg.get("meet_link"),
        "created_at": msg.get("created_at"),
        "room_type": room_type,
        "room_id": room_id,
    }


@router.get("/history/{room_type}/{room_id}")
async def get_realtime_history(
    room_type: str,
    room_id: str,
    limit: int = 100,
    current_user_id: str = Depends(get_current_user),
):
    _validate_room_type(room_type)
    chat_type = _map_chat_type(room_type)

    try:
        db = get_db()
        result = (
            db.table("exchange_chat_history")
            .select("*")
            .eq("chat_type", chat_type)
            .eq("reference_id", room_id)
            .order("created_at", desc=False)
            .limit(max(1, min(limit, 200)))
            .execute()
        )

        messages = [
            _normalize_history_message(msg, room_type, room_id)
            for msg in (result.data or [])
        ]

        return {
            "room_type": room_type,
            "room_id": room_id,
            "requester_id": current_user_id,
            "messages": messages,
        }
    except Exception as e:
        err_text = str(e).lower()
        if "exchange_chat_history" in err_text and "does not exist" in err_text:
            return {
                "room_type": room_type,
                "room_id": room_id,
                "requester_id": current_user_id,
                "messages": [],
                "note": "Run exchange_chat_history migration SQL first.",
            }
        logger.error(f"Error fetching realtime history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{room_type}/{room_id}")
async def realtime_ws(websocket: WebSocket, room_type: str, room_id: str, token: str = Query(...)):
      # Accept the WebSocket connection FIRST before any validation
    await websocket.accept()
    try:
        token_data = decode_access_token(token)
        user_id = token_data.user_id
        if not user_id:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    if room_type not in ["task", "session", "exchange"]:
        await websocket.close(code=1003)
        return

    key = _room_key(room_type, room_id)
     # Add user to the room (no need to accept again, already accepted above)
    if key not in manager.rooms:
        manager.rooms[key] = {}
    manager.rooms[key][user_id] = websocket

    join_event = {
        "id": str(uuid.uuid4()),
        "room_type": room_type,
        "room_id": room_id,
        "sender_id": user_id,
        "message_type": "system",
        "content": "joined",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await manager.broadcast(key, join_event)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = json.loads(raw_data)
            except json.JSONDecodeError:
                payload = {"content": raw_data}

            content = str(payload.get("content") or "").strip()
            if not content:
                await websocket.send_json({"event": "error", "detail": "Message cannot be empty"})
                continue

            meet_link = payload.get("meet_link")

            message_payload = {
                "id": str(uuid.uuid4()),
                "room_type": room_type,
                "room_id": room_id,
                "sender_id": user_id,
                "message_type": payload.get("message_type", "text"),
                "content": content,
                "meet_link": meet_link,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

            try:
                _persist_message(room_type, room_id, user_id, content, meet_link)
            except Exception as e:
                logger.warning(f"Realtime message not persisted: {str(e)}")

            await manager.broadcast(key, message_payload)

    except WebSocketDisconnect:
        manager.disconnect(key, user_id)
        leave_event = {
            "id": str(uuid.uuid4()),
            "room_type": room_type,
            "room_id": room_id,
            "sender_id": user_id,
            "message_type": "system",
            "content": "left",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await manager.broadcast(key, leave_event)
