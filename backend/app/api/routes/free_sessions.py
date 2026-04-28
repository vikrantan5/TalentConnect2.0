from fastapi import APIRouter, HTTPException, Depends
from app.utils.auth import get_current_user
from app.database import get_db
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/free-sessions", tags=["Free Sessions"])



# Import socket manager for real-time notifications
try:
    from app.socket_manager import send_notification_to_user, send_session_notification
    SOCKET_ENABLED = True
except ImportError:
    SOCKET_ENABLED = False
    logger.warning("Socket manager not available, real-time features disabled")

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



BONUS_POINTS = 500


def _has_skill_to_exchange(db, learner_id: str, mentor_id: str) -> bool:
    """Check if learner has any skill that mentor wants to learn."""
    try:
        learner_offered = db.table('user_skills').select('skill_name').eq(
            'user_id', learner_id
        ).eq('skill_type', 'offered').execute()
        offered_names = {s['skill_name'].lower() for s in (learner_offered.data or [])}
        if not offered_names:
            return False

        mentor_wanted = db.table('user_skills').select('skill_name').eq(
            'user_id', mentor_id
        ).eq('skill_type', 'wanted').execute()
        wanted_names = {s['skill_name'].lower() for s in (mentor_wanted.data or [])}

        return bool(offered_names & wanted_names)
    except Exception as e:
        logger.warning(f"Skill exchange check failed: {e}")
        return False


def _adjust_user_points(db, user_id: str, delta: int, reason: str, reference_key: str) -> int:
    """Apply delta to user.points and log. Idempotent via reference_key. Returns applied delta (0 if duplicate)."""
    try:
        existing = db.table('reward_points_log').select('id').eq(
            'user_id', user_id
        ).eq('reference_key', reference_key).limit(1).execute()
        if existing.data:
            return 0

        db.table('reward_points_log').insert({
            'user_id': user_id,
            'points': delta,
            'reason': reason,
            'reference_key': reference_key,
        }).execute()

        user_row = db.table('users').select('points').eq('id', user_id).single().execute()
        current = (user_row.data or {}).get('points') or 0
        new_points = max(0, current + delta)  # prevent negative balance
        db.table('users').update({'points': new_points}).eq('id', user_id).execute()
        return delta
    except Exception as e:
        logger.error(f"Point adjust failed user={user_id} delta={delta} ref={reference_key}: {e}")
        return 0

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

        # Combine date + time into scheduled_at
        scheduled_at = None
        if data.date and data.time:
            try:
                scheduled_at = f"{data.date}T{data.time}:00+00:00"
            except Exception:
                scheduled_at = None

        session_data = {
            'mentor_id': data.receiver_id,     # receiver is the mentor
            'learner_id': current_user_id,      # sender is the learner
            'skill_name': data.skill_learn or data.skill_teach or 'General',
            'duration_minutes': data.duration,
            'scheduled_at': scheduled_at,
            'mentor_notes': data.message or f"I'd like to have a {'skill exchange' if data.session_type == 'exchange' else 'mentoring'} session with you.",
            'status': 'pending',
        }

        # Use learning_sessions table
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
                skill_info = f"📚 Skill Exchange:  • I'll teach: {data.skill_teach}  • You teach me: {data.skill_learn}"
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



        # Send real-time notification via Socket.IO
        if SOCKET_ENABLED:
            import asyncio
            asyncio.create_task(send_session_notification(data.receiver_id, {
                'title': 'New Session Request',
                'message': f'{sender_name} requested a {data.session_type} session{skill_info}',
                'session_id': session_id,
                'sender_id': current_user_id
            }, 'session_request'))


        return {"message": "Session request sent!", "session": result.data[0], "chat_id": chat_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-sessions")
async def get_my_free_sessions(current_user_id: str = Depends(get_current_user)):
    """Get all learning sessions for current user (as mentor or learner)"""
    try:
        db = get_db()

        as_learner = db.table('learning_sessions').select('*').eq('learner_id', current_user_id).order('created_at', desc=True).execute()
        as_mentor = db.table('learning_sessions').select('*').eq('mentor_id', current_user_id).order('created_at', desc=True).execute()

        all_sessions = (as_learner.data or []) + (as_mentor.data or [])
        if not all_sessions:
            return {"sessions": []}

        enriched = []
        for session in all_sessions:
            is_learner = session.get('learner_id') == current_user_id
            other_id = session.get('mentor_id') if is_learner else session.get('learner_id')
            user_result = db.table('users').select('id, username, full_name, profile_photo').eq('id', other_id).execute()

            enriched.append({
                "session": session,
                "other_user": user_result.data[0] if user_result.data else None,
                "role": "learner" if is_learner else "mentor"
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
        if s.get('mentor_id') != current_user_id:
            raise HTTPException(status_code=403, detail="Only the mentor can accept/reject")

        if s['status'] != 'pending':
            raise HTTPException(status_code=400, detail="Session already processed")

        db.table('learning_sessions').update({'status': data.status}).eq('id', session_id).execute()

        
        # Points transfer: If mentor ACCEPTS and learner has NO skill to exchange,
        # mentor earns +500 bonus, learner is charged -500 points.
        points_transferred = 0
        learner_id_pt = s.get('learner_id')
        mentor_id_pt = s.get('mentor_id')
        if data.status == 'accepted' and learner_id_pt and mentor_id_pt:
            can_exchange = _has_skill_to_exchange(db, learner_id_pt, mentor_id_pt)
            if not can_exchange:
                ref = f"session_accept:{session_id}"
                # Award mentor +500
                _adjust_user_points(
                    db, mentor_id_pt, BONUS_POINTS,
                    f"Mentor bonus for accepting one-way session {session_id}",
                    f"{ref}:mentor_bonus"
                )
                # Deduct learner -500
                _adjust_user_points(
                    db, learner_id_pt, -BONUS_POINTS,
                    f"Learner charge for one-way session {session_id}",
                    f"{ref}:learner_charge"
                )
                points_transferred = BONUS_POINTS

        # Send message to chat about status update
        learner_id = s.get('learner_id')
        mentor_id = s.get('mentor_id')
        if learner_id and mentor_id:
            sorted_ids = sorted([learner_id, mentor_id])
            chat = db.table('chat_history').select('*').eq('user1_id', sorted_ids[0]).eq('user2_id', sorted_ids[1]).execute()
            
            if chat and chat.data:
                chat_id = chat.data[0]['id']
                status_emoji = "✅" if data.status == "accepted" else "❌"
                status_message = f"{status_emoji} Session {data.status.upper()}![Session ID: {session_id}]"
                db.table('realtime_messages').insert({
                    'chat_id': chat_id,
                    'sender_id': current_user_id,
                    'text': status_message,
                    'message_type': 'session_update',
                    'reference_id': session_id
                }).execute()

        # Notify learner
        receiver = db.table('users').select('username, full_name').eq('id', current_user_id).execute()
        receiver_name = receiver.data[0].get('full_name') or receiver.data[0].get('username') if receiver.data else 'Someone'

        if learner_id:
            db.table('notifications').insert({
                'user_id': learner_id,
                'title': f'Session {data.status.title()}',
                'message': f'{receiver_name} has {data.status} your session request',
                'notification_type': 'session',
                'reference_id': session_id,
                'reference_type': 'learning_session'
            }).execute()


             # Send real-time notification via Socket.IO
            if SOCKET_ENABLED:
                import asyncio
                asyncio.create_task(send_session_notification(learner_id, {
                    'title': f'Session {data.status.title()}',
                    'message': f'{receiver_name} has {data.status} your session request',
                    'session_id': session_id,
                    'sender_id': current_user_id
                }, f'session_{data.status}'))

            return {"message": f"Session {data.status}", "session_id": session_id, "points_transferred": points_transferred}

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
        
        # Both learner and mentor can add meeting link
        if s['learner_id'] != current_user_id and s['mentor_id'] != current_user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        if s['status'] != 'accepted':
            raise HTTPException(status_code=400, detail="Can only add meeting link to accepted sessions")

        # Update session with meeting link
        db.table('learning_sessions').update({'meeting_link': data.meeting_link}).eq('id', session_id).execute()

        # Send message to chat with meeting link
        sorted_ids = sorted([s['learner_id'], s['mentor_id']])
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
        other_user_id = s['mentor_id'] if s['learner_id'] == current_user_id else s['learner_id']
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