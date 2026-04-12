import socketio
from app.utils.auth import decode_access_token
from app.database import get_db
from datetime import datetime, timezone
import logging
import json

logger = logging.getLogger(__name__)

# Create Socket.IO server with ASGI mode
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

# Store connected users: {user_id: [sid1, sid2, ...]}
connected_users = {}
# Store user info by sid: {sid: user_id}
sid_to_user = {}

async def authenticate_user(token):
    """Authenticate user from token"""
    try:
        if not token:
            return None
        token_data = decode_access_token(token)
        return token_data.user_id if token_data else None
    except Exception as e:
        logger.error(f"Socket auth error: {e}")
        return None


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    try:
        token = auth.get('token') if auth else None
        if not token:
            # Try to get token from query string
            query_string = environ.get('QUERY_STRING', '')
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=')[1]
                    break
        
        user_id = await authenticate_user(token)
        
        if not user_id:
            logger.warning(f"Socket connection rejected - invalid token for sid: {sid}")
            return False
        
        # Store connection
        if user_id not in connected_users:
            connected_users[user_id] = []
        connected_users[user_id].append(sid)
        sid_to_user[sid] = user_id
        
        # Join user's personal room for notifications
        await sio.enter_room(sid, f"user_{user_id}")
        
        logger.info(f"User {user_id} connected with sid: {sid}")
        
        # Send connection confirmation
        await sio.emit('connected', {
            'status': 'connected',
            'user_id': user_id
        }, to=sid)
        
        return True
        
    except Exception as e:
        logger.error(f"Socket connect error: {e}")
        return False


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    try:
        user_id = sid_to_user.get(sid)
        if user_id:
            if user_id in connected_users:
                connected_users[user_id] = [s for s in connected_users[user_id] if s != sid]
                if not connected_users[user_id]:
                    del connected_users[user_id]
            del sid_to_user[sid]
            logger.info(f"User {user_id} disconnected from sid: {sid}")
    except Exception as e:
        logger.error(f"Socket disconnect error: {e}")


@sio.event
async def join_chat(sid, data):
    """Join a chat room for real-time messaging"""
    try:
        user_id = sid_to_user.get(sid)
        if not user_id:
            await sio.emit('error', {'message': 'Not authenticated'}, to=sid)
            return
        
        chat_id = data.get('chat_id')
        if not chat_id:
            await sio.emit('error', {'message': 'Chat ID required'}, to=sid)
            return
        
        db = get_db()
        
        # Verify user is participant of this chat
        chat = db.table('chat_history').select('*').eq('id', chat_id).execute()
        if not chat.data:
            await sio.emit('error', {'message': 'Chat not found'}, to=sid)
            return
        
        c = chat.data[0]
        if user_id not in [c['user1_id'], c['user2_id']]:
            await sio.emit('error', {'message': 'Not authorized'}, to=sid)
            return
        
        # Join the chat room
        await sio.enter_room(sid, f"chat_{chat_id}")
        
        await sio.emit('joined_chat', {
            'chat_id': chat_id,
            'status': 'joined'
        }, to=sid)
        
        logger.info(f"User {user_id} joined chat room: {chat_id}")
        
    except Exception as e:
        logger.error(f"Join chat error: {e}")
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def leave_chat(sid, data):
    """Leave a chat room"""
    try:
        chat_id = data.get('chat_id')
        if chat_id:
            await sio.leave_room(sid, f"chat_{chat_id}")
            logger.info(f"Sid {sid} left chat room: {chat_id}")
    except Exception as e:
        logger.error(f"Leave chat error: {e}")


@sio.event
async def send_message(sid, data):
    """Handle sending a message"""
    try:
        user_id = sid_to_user.get(sid)
        if not user_id:
            await sio.emit('error', {'message': 'Not authenticated'}, to=sid)
            return
        
        chat_id = data.get('chat_id')
        text = data.get('text', '').strip()
        
        if not chat_id or not text:
            await sio.emit('error', {'message': 'Chat ID and text required'}, to=sid)
            return
        
        db = get_db()
        
        # Verify user is participant
        chat = db.table('chat_history').select('*').eq('id', chat_id).execute()
        if not chat.data:
            await sio.emit('error', {'message': 'Chat not found'}, to=sid)
            return
        
        c = chat.data[0]
        if user_id not in [c['user1_id'], c['user2_id']]:
            await sio.emit('error', {'message': 'Not authorized'}, to=sid)
            return
        
        # Save message to database
        message_data = {
            'chat_id': chat_id,
            'sender_id': user_id,
            'text': text,
        }
        
        result = db.table('realtime_messages').insert(message_data).execute()
        saved_message = result.data[0] if result.data else message_data
        
        # Update chat timestamp
        db.table('chat_history').update({
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', chat_id).execute()
        
        # Get sender info
        sender = db.table('users').select('username, full_name, profile_photo').eq('id', user_id).execute()
        sender_info = sender.data[0] if sender.data else {}
        
        # Broadcast to chat room
        broadcast_data = {
            'type': 'message',
            'chat_id': chat_id,
            'message': {
                'id': saved_message.get('id'),
                'sender_id': user_id,
                'text': text,
                'created_at': saved_message.get('created_at', datetime.now(timezone.utc).isoformat()),
                'sender_name': sender_info.get('full_name') or sender_info.get('username', 'User')
            }
        }
        
        await sio.emit('new_message', broadcast_data, room=f"chat_{chat_id}")
        
        # Send notification to the other user
        other_user_id = c['user2_id'] if c['user1_id'] == user_id else c['user1_id']
        
        # Create notification in database
        db.table('notifications').insert({
            'user_id': other_user_id,
            'title': 'New Message',
            'message': f'New message from {sender_info.get("full_name") or sender_info.get("username", "Someone")}',
            'notification_type': 'message',
            'reference_id': chat_id,
            'reference_type': 'chat'
        }).execute()
        
        # Send real-time notification
        await sio.emit('notification', {
            'type': 'message',
            'title': 'New Message',
            'message': f'New message from {sender_info.get("full_name") or sender_info.get("username", "Someone")}',
            'chat_id': chat_id,
            'sender_id': user_id
        }, room=f"user_{other_user_id}")
        
        logger.info(f"Message sent in chat {chat_id} by user {user_id}")
        
    except Exception as e:
        logger.error(f"Send message error: {e}")
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def typing(sid, data):
    """Handle typing indicator"""
    try:
        user_id = sid_to_user.get(sid)
        if not user_id:
            return
        
        chat_id = data.get('chat_id')
        is_typing = data.get('is_typing', False)
        
        if chat_id:
            await sio.emit('user_typing', {
                'chat_id': chat_id,
                'user_id': user_id,
                'is_typing': is_typing
            }, room=f"chat_{chat_id}", skip_sid=sid)
            
    except Exception as e:
        logger.error(f"Typing indicator error: {e}")


# Utility functions for external use
async def send_notification_to_user(user_id: str, notification: dict):
    """Send a real-time notification to a specific user"""
    try:
        await sio.emit('notification', notification, room=f"user_{user_id}")
        logger.info(f"Notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending notification: {e}")


async def send_session_notification(user_id: str, session_data: dict, notification_type: str):
    """Send a session-related notification"""
    try:
        notification = {
            'type': notification_type,
            'title': session_data.get('title', 'Session Update'),
            'message': session_data.get('message', ''),
            'session_id': session_data.get('session_id'),
            'sender_id': session_data.get('sender_id')
        }
        await send_notification_to_user(user_id, notification)
    except Exception as e:
        logger.error(f"Error sending session notification: {e}")


def is_user_online(user_id: str) -> bool:
    """Check if a user is currently connected"""
    return user_id in connected_users and len(connected_users[user_id]) > 0


def get_online_users() -> list:
    """Get list of online user IDs"""
    return list(connected_users.keys())
