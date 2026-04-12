from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from app.utils.auth import get_current_user, decode_access_token
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime, timezone
import logging
import uuid
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatCreateRequest(BaseModel):
    receiver_id: str
    message: Optional[str] = None


class ChatMessageRequest(BaseModel):
    text: str


# WebSocket Connection Manager for Chat (kept for backward compatibility)
class ChatConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, chat_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}
        self.active_connections[chat_id][user_id] = websocket

    def disconnect(self, chat_id: str, user_id: str):
        if chat_id in self.active_connections:
            if user_id in self.active_connections[chat_id]:
                del self.active_connections[chat_id][user_id]
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    async def broadcast(self, chat_id: str, message: dict):
        if chat_id in self.active_connections:
            stale = []
            for uid, conn in self.active_connections[chat_id].items():
                try:
                    await conn.send_json(message)
                except Exception:
                    stale.append(uid)
            for uid in stale:
                self.disconnect(chat_id, uid)


chat_manager = ChatConnectionManager()


# Import socket manager for real-time notifications
try:
    from app.socket_manager import send_notification_to_user, sio
    SOCKET_ENABLED = True
except ImportError:
    SOCKET_ENABLED = False
    logger.warning("Socket manager not available, real-time features disabled")

@router.post("/create")
async def create_or_get_chat(data: ChatCreateRequest, current_user_id: str = Depends(get_current_user)):
    """Create a chat or get existing one between two users"""
    try:
        db = get_db()
        receiver_id = data.receiver_id

        if current_user_id == receiver_id:
            raise HTTPException(status_code=400, detail="Cannot chat with yourself")

        # Check receiver exists
        receiver = db.table('users').select('id, username, full_name, profile_photo, avatar_url').eq('id', receiver_id).execute()
        if not receiver.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        receiver_info = receiver.data[0]

        # Get sender info
        sender = db.table('users').select('id, username, full_name, profile_photo, avatar_url').eq('id', current_user_id).execute()
        sender_info = sender.data[0] if sender.data else {}
        sender_name = sender_info.get('full_name') or sender_info.get('username', 'Someone')

        # Check if chat already exists between the two users
        sorted_ids = sorted([current_user_id, receiver_id])

        # Try to get existing chat from chat_history table
        existing = None
        try:
            existing = db.table('chat_history').select('*').eq('user1_id', sorted_ids[0]).eq('user2_id', sorted_ids[1]).execute()
            logger.info(f"Found existing chat: {existing.data if existing else None}")
        except Exception as e:
            logger.warning(f"chat_history table query failed: {e}")

        if existing and existing.data:
            return {
                "chat": existing.data[0], 
                "created": False,
                "other_user": receiver_info
            }

        # Create new chat in chat_history table
        new_chat = {
            'user1_id': sorted_ids[0],
            'user2_id': sorted_ids[1],
        }

        # Insert into chat_history table
        result = None
        try:
            result = db.table('chat_history').insert(new_chat).execute()
            logger.info(f"Created new chat: {result.data if result else None}")
        except Exception as e:
            logger.error(f"chat_history insert failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create chat")

        chat_id = result.data[0]['id']
        
        # Send initial message if provided
        if data.message:
            msg = {
                'chat_id': chat_id,
                'sender_id': current_user_id,
                'text': data.message,
            }
            try:
                db.table('realtime_messages').insert(msg).execute()
            except Exception as e:
                logger.warning(f"Failed to insert initial message: {e}")

        # Create notification for receiver about new chat
        try:
            db.table('notifications').insert({
                'user_id': receiver_id,
                'title': 'New Chat Started',
                'message': f'{sender_name} started a conversation with you',
                'notification_type': 'chat',
                'reference_id': chat_id,
                'reference_type': 'chat'
            }).execute()
            
            # Send real-time notification via Socket.IO
            if SOCKET_ENABLED:
                import asyncio
                asyncio.create_task(send_notification_to_user(receiver_id, {
                    'type': 'new_chat',
                    'title': 'New Chat Started',
                    'message': f'{sender_name} started a conversation with you',
                    'chat_id': chat_id,
                    'sender_id': current_user_id,
                    'sender_name': sender_name
                }))
        except Exception as e:
            logger.warning(f"Failed to create chat notification: {e}")

        return {
            "chat": result.data[0], 
            "created": True,
            "other_user": receiver_info
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_or_get_chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-chats")
async def get_my_chats(current_user_id: str = Depends(get_current_user)):
    """Get all chats for the current user"""
    try:
        db = get_db()

        # Get chats from chat_history table
        chats1 = db.table('chat_history').select('*').eq('user1_id', current_user_id).execute()
        chats2 = db.table('chat_history').select('*').eq('user2_id', current_user_id).execute()

        all_chats = (chats1.data or []) + (chats2.data or [])

        if not all_chats:
            return {"chats": []}

        enriched = []
        for chat in all_chats:
            other_id = chat['user2_id'] if chat['user1_id'] == current_user_id else chat['user1_id']
            user_result = db.table('users').select('id, username, full_name, profile_photo, avatar_url').eq('id', other_id).execute()

            # Get last message from realtime_messages
            last_msg = db.table('realtime_messages').select('*').eq('chat_id', chat['id']).order('created_at', desc=True).limit(1).execute()

            enriched.append({
                "chat": chat,
                "other_user": user_result.data[0] if user_result.data else None,
                "last_message": last_msg.data[0] if last_msg.data else None,
            })

        return {"chats": enriched}

    except Exception as e:
        logger.error(f"Error fetching chats: {e}")
        if "does not exist" in str(e).lower():
            return {"chats": [], "note": "Chat tables not yet created in database"}
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{chat_id}/messages")
async def get_chat_messages(chat_id: str, limit: int = 100, current_user_id: str = Depends(get_current_user)):
    """Get messages for a chat"""
    try:
        db = get_db()

        # Get chat from chat_history table
        chat = db.table('chat_history').select('*').eq('id', chat_id).execute()
            
        if not chat.data:
            raise HTTPException(status_code=404, detail="Chat not found")

        c = chat.data[0]
        if current_user_id not in [c['user1_id'], c['user2_id']]:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Get messages from realtime_messages table
        messages = db.table('realtime_messages').select('*').eq('chat_id', chat_id).order('created_at', desc=False).limit(min(limit, 200)).execute()

        return {"chat_id": chat_id, "messages": messages.data or []}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        if "does not exist" in str(e).lower():
            return {"chat_id": chat_id, "messages": [], "note": "Chat tables not yet created"}
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{chat_id}/send")
async def send_message(chat_id: str, msg: ChatMessageRequest, current_user_id: str = Depends(get_current_user)):
    """Send a message in a chat"""
    try:
        db = get_db()

        # Get chat from chat_history table
        chat = db.table('chat_history').select('*').eq('id', chat_id).execute()
        if not chat.data:
            raise HTTPException(status_code=404, detail="Chat not found")

        c = chat.data[0]
        if current_user_id not in [c['user1_id'], c['user2_id']]:
            raise HTTPException(status_code=403, detail="Not authorized")

        message_data = {
            'chat_id': chat_id,
            'sender_id': current_user_id,
            'text': msg.text,
        }

        # Insert into realtime_messages table
        result = db.table('realtime_messages').insert(message_data).execute()

        # Update chat's updated_at in chat_history table
        try:
            db.table('chat_history').update({'updated_at': datetime.now(timezone.utc).isoformat()}).eq('id', chat_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update chat timestamp: {e}")

        # Notify the other user
        other_id = c['user2_id'] if c['user1_id'] == current_user_id else c['user1_id']
        sender_info = db.table('users').select('username, full_name').eq('id', current_user_id).execute()
        sender_name = sender_info.data[0].get('full_name') or sender_info.data[0].get('username') if sender_info.data else 'Someone'

        db.table('notifications').insert({
            'user_id': other_id,
            'title': 'New Message',
            'message': f'New message from {sender_name}',
            'notification_type': 'message',
            'reference_id': chat_id,
            'reference_type': 'chat'
        }).execute()

        return {"message": result.data[0] if result.data else message_data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{chat_id}")
async def chat_websocket(websocket: WebSocket, chat_id: str, token: str = Query(...)):
    """WebSocket endpoint for real-time chat"""
    try:
        token_data = decode_access_token(token)
        user_id = token_data.user_id
        if not user_id:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.accept()
        await websocket.close(code=1008, reason="Authentication failed")
        return

    await chat_manager.connect(chat_id, user_id, websocket)

    join_msg = {
        "type": "system",
        "sender_id": user_id,
        "text": "joined",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await chat_manager.broadcast(chat_id, join_msg)

    try:
        db = get_db()
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = {"text": raw}

            text = str(payload.get("text", "")).strip()
            if not text:
                continue

            msg_data = {
                "chat_id": chat_id,
                "sender_id": user_id,
                "text": text,
            }

            try:
                result = db.table('realtime_messages').insert(msg_data).execute()
                msg_data = result.data[0] if result.data else msg_data
            except Exception as e:
                logger.warning(f"Failed to persist chat message: {e}")

            broadcast_msg = {
                "type": "message",
                "sender_id": user_id,
                "text": text,
                "chat_id": chat_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await chat_manager.broadcast(chat_id, broadcast_msg)

    except WebSocketDisconnect:
        chat_manager.disconnect(chat_id, user_id)
        leave_msg = {
            "type": "system",
            "sender_id": user_id,
            "text": "left",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await chat_manager.broadcast(chat_id, leave_msg)
    except Exception as e:
        logger.error(f"Chat WebSocket error: {e}")
        chat_manager.disconnect(chat_id, user_id)