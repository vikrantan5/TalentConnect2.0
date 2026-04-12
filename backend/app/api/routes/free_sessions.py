from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.database import get_db
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/free-sessions", tags=["Free Sessions"])


class FreeSessionCreate(BaseModel):
    receiver_id: str
    session_type: str = "mentor"  # "mentor" or "exchange"
    skill_teach: Optional[str] = None
    skill_learn: Optional[str] = None
    date: str
    time: str
    duration: int = 60
    message: Optional[str] = None


class FreeSessionUpdate(BaseModel):
    status: str  # "accepted" or "rejected"
class MeetingLinkUpdate(BaseModel):
    meeting_link: str

@router.post("/book")
async def book_free_session(data: FreeSessionCreate, current_user_id: str = Depends(get_current_user)):
    """Book a free session (mentor or exchange) and create chat message"""
    try:
        db = get_db()

        if current_user_id == data.receiver_id:
            raise HTTPException(status_code=400, detail="Cannot book session with yourself")

        # Verify receiver exists
        receiver = db.table('users').select('id, username, full_name').eq('id', data.receiver_id).execute()
        if not receiver.data:
            raise HTTPException(status_code=404, detail="User not found")

        sender = db.table('users').select('id, username, full_name').eq('id', current_user_id).execute()
        sender_name = sender.data[0].get('full_name') or sender.data[0].get('username') if sender.data else 'Someone'
        receiver_name = receiver.data[0].get('full_name') or receiver.data[0].get('username')

        session_data = {
            'sender_id': current_user_id,
            'receiver_id': data.receiver_id,
            'session_type': data.session_type,
            'skill_teach': data.skill_teach,
            'skill_learn': data.skill_learn,
            'session_date': data.date,
            'session_time': data.time,
            'duration_minutes': data.duration,
            'message': data.message or f"I'd like to have a {'skill exchange' if data.session_type == 'exchange' else 'mentoring'} session with you.",
            'status': 'pending',
        }

        # Use learning_sessions table instead of free_sessions
        result = db.table('learning_sessions').insert(session_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to book session")

        session_id = result.data[0]['id']

        # Create or get chat between users
        sorted_ids = sorted([current_user_id, data.receiver_id])
        existing_chat = db.table('chat_history').select('*').eq('user1_id', sorted_ids[0]).eq('user2_id', sorted_ids[1]).execute()
        
        if existing_chat and existing_chat.data:
            chat_id = existing_chat.data[0]['id']
        else:
            # Create new chat
            new_chat = db.table('chat_history').insert({
                'user1_id': sorted_ids[0],
                'user2_id': sorted_ids[1],
            }).execute()
            chat_id = new_chat.data[0]['id'] if new_chat.data else None

        # Send session request message to chat
        if chat_id:
            skill_info = ""
            if data.session_type == "exchange" and data.skill_teach and data.skill_learn:
                skill_info = f"📚 Skill Exchange:• I'll teach: {data.skill_teach}• You teach me: {data.skill_learn}"
            elif data.skill_learn:
                skill_info = f"📚 Learning: {data.skill_learn}"

            session_message = f"📅 Session Request{data.message or 'I would like to book a session with you!'}{skill_info}📆 Date: {data.date}⏰ Time: {data.time}⏱️ Duration: {data.duration} minutes[Session ID: {session_id}]"
            
            db.table('realtime_messages').insert({
                'chat_id': chat_id,
                'sender_id': current_user_id,
                'text': session_message,
                'message_type': 'session_request',
                'reference_id': session_id
            }).execute()

        # Notify receiver
        skill_info = ""
        if data.session_type == "exchange" and data.skill_teach and data.skill_learn:
            skill_info = f" - I'll teach {data.skill_teach}, you teach me {data.skill_learn}"
        elif data.skill_learn:
            skill_info = f" for {data.skill_learn}"

        db.table('notifications').insert({
            'user_id': data.receiver_id,
            'title': 'New Session Request',
            'message': f'{sender_name} requested a {data.session_type} session{skill_info}',
            'notification_type': 'session',
            'reference_id': session_id,
            'reference_type': 'learning_session'
        }).execute()

        return {"message": "Session request sent!", "session": result.data[0], "chat_id": chat_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-sessions")
async def get_my_free_sessions(current_user_id: str = Depends(get_current_user)):
    """Get all learning sessions for current user"""
    try:
        db = get_db()

        sent = db.table('learning_sessions').select('*').eq('sender_id', current_user_id).order('created_at', desc=True).execute()
        received = db.table('learning_sessions').select('*').eq('receiver_id', current_user_id).order('created_at', desc=True).execute()

        all_sessions = (sent.data or []) + (received.data or [])
        if not all_sessions:
            return {"sessions": []}

        enriched = []
        for session in all_sessions:
            other_id = session['receiver_id'] if session['sender_id'] == current_user_id else session['sender_id']
            user_result = db.table('users').select('id, username, full_name, profile_photo').eq('id', other_id).execute()

            enriched.append({
                "session": session,
                "other_user": user_result.data[0] if user_result.data else None,
                "role": "sender" if session['sender_id'] == current_user_id else "receiver"
            })

        return {"sessions": enriched}

    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        if "does not exist" in str(e).lower():
            return {"sessions": [], "note": "Learning sessions table not yet created"}
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{session_id}")
async def update_free_session(session_id: str, data: FreeSessionUpdate, current_user_id: str = Depends(get_current_user)):
    """Accept or reject a learning session"""
    try:
        db = get_db()

        session = db.table('learning_sessions').select('*').eq('id', session_id).execute()
        if not session.data:
            raise HTTPException(status_code=404, detail="Session not found")

        s = session.data[0]
        if s['receiver_id'] != current_user_id:
            raise HTTPException(status_code=403, detail="Only the receiver can accept/reject")

        if s['status'] != 'pending':
            raise HTTPException(status_code=400, detail="Session already processed")

        db.table('learning_sessions').update({'status': data.status}).eq('id', session_id).execute()

        # Send message to chat about status update
        sorted_ids = sorted([s['sender_id'], s['receiver_id']])
        chat = db.table('chat_history').select('*').eq('user1_id', sorted_ids[0]).eq('user2_id', sorted_ids[1]).execute()
        
        if chat and chat.data:
            chat_id = chat.data[0]['id']
            status_message = f"✅ Session {data.status.upper()}![Session ID: {session_id}]"
            db.table('realtime_messages').insert({
                'chat_id': chat_id,
                'sender_id': current_user_id,
                'text': status_message,
                'message_type': 'session_update',
                'reference_id': session_id
            }).execute()

        # Notify sender
        receiver = db.table('users').select('username, full_name').eq('id', current_user_id).execute()
        receiver_name = receiver.data[0].get('full_name') or receiver.data[0].get('username') if receiver.data else 'Someone'

        db.table('notifications').insert({
            'user_id': s['sender_id'],
            'title': f'Session {data.status.title()}',
            'message': f'{receiver_name} has {data.status} your session request',
            'notification_type': 'session',
            'reference_id': session_id,
            'reference_type': 'learning_session'
        }).execute()

        return {"message": f"Session {data.status}", "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{session_id}/meeting-link")
async def add_meeting_link(session_id: str, data: MeetingLinkUpdate, current_user_id: str = Depends(get_current_user)):
    """Add Google Meet link to an accepted session"""
    try:
        db = get_db()

        session = db.table('learning_sessions').select('*').eq('id', session_id).execute()
        if not session.data:
            raise HTTPException(status_code=404, detail="Session not found")

        s = session.data[0]
        
        # Both sender and receiver can add meeting link
        if s['sender_id'] != current_user_id and s['receiver_id'] != current_user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        if s['status'] != 'accepted':
            raise HTTPException(status_code=400, detail="Can only add meeting link to accepted sessions")

        # Update session with meeting link
        db.table('learning_sessions').update({'meeting_link': data.meeting_link}).eq('id', session_id).execute()

        # Send message to chat with meeting link
        sorted_ids = sorted([s['sender_id'], s['receiver_id']])
        chat = db.table('chat_history').select('*').eq('user1_id', sorted_ids[0]).eq('user2_id', sorted_ids[1]).execute()
        
        if chat and chat.data:
            chat_id = chat.data[0]['id']
            link_message = f"🔗 Google Meet Link Added!{data.meeting_link}[Session ID: {session_id}]"
            db.table('realtime_messages').insert({
                'chat_id': chat_id,
                'sender_id': current_user_id,
                'text': link_message,
                'message_type': 'meeting_link',
                'reference_id': session_id
            }).execute()

        # Notify the other user
        other_user_id = s['receiver_id'] if s['sender_id'] == current_user_id else s['sender_id']
        sender = db.table('users').select('username, full_name').eq('id', current_user_id).execute()
        sender_name = sender.data[0].get('full_name') or sender.data[0].get('username') if sender.data else 'Someone'

        db.table('notifications').insert({
            'user_id': other_user_id,
            'title': 'Meeting Link Added',
            'message': f'{sender_name} added a Google Meet link to your session',
            'notification_type': 'session',
            'reference_id': session_id,
            'reference_type': 'learning_session'
        }).execute()

        return {"message": "Meeting link added successfully", "meeting_link": data.meeting_link}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding meeting link: {e}")
        raise HTTPException(status_code=500, detail=str(e))