import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Wifi, WifiOff } from 'lucide-react';
import api from '../services/api';
import { realtimeService } from '../services/apiService';

const RealtimeChat = ({ roomType, roomId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    loadHistory();
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const response = await api.get(`/api/realtime/history/${roomType}/${roomId}`);
      setMessages(response.data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const fullWsUrl = realtimeService.buildWebSocketUrl(roomType, roomId, token);
    try {
      const ws = new WebSocket(fullWsUrl);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (event) => {
        try { setMessages(prev => [...prev, JSON.parse(event.data)]); } catch (e) { /* */ }
      };
      ws.onerror = () => setConnected(false);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(() => { if (wsRef.current === ws) connectWebSocket(); }, 3000);
      };
      wsRef.current = ws;
    } catch (e) {
      setConnected(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content: newMessage.trim(), message_type: 'text' }));
    setNewMessage('');
  };

  const formatTime = (timestamp) => timestamp ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) {
    return (
      <div className="bento p-0 flex items-center justify-center h-96">
        <div className="tc-spinner" />
      </div>
    );
  }

  return (
    <div className="bento p-0 flex flex-col h-full overflow-hidden" data-testid="realtime-chat">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 glass-strong flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ink-950 ring-1 ring-white/10 grid place-items-center text-cyan-300">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Live chat</p>
            <p className="text-[11px] uppercase tracking-widest flex items-center gap-1.5">
              {connected ? (
                <span className="text-emerald-500 flex items-center gap-1.5"><Wifi className="w-3 h-3" />connected</span>
              ) : (
                <span className="text-coral-500 flex items-center gap-1.5"><WifiOff className="w-3 h-3" />offline</span>
              )}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-9 h-9 rounded-full glass grid place-items-center hover:shadow-glow transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <MessageCircle className="w-10 h-10 text-ink-300" />
            <p className="text-sm text-ink-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender_id === currentUser?.id;
            const isSystem = msg.message_type === 'system';
            if (isSystem) {
              return (
                <div key={msg.id || index} className="flex justify-center">
                  <span className="chip chip-ink text-[10px]">User {msg.content}</span>
                </div>
              );
            }
            return (
              <div key={msg.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-soft ${
                  isOwn
                    ? 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-white'
                    : 'glass border border-black/5 dark:border-white/10'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] uppercase tracking-widest mt-1.5 ${isOwn ? 'text-white/70' : 'text-ink-400'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-black/5 dark:border-white/10 glass-strong flex-shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 focus-within:border-cyan-400 focus-within:shadow-glow transition">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 bg-transparent outline-none text-sm py-3"
              disabled={!connected}
              data-testid="chat-input"
            />
          </div>
          <button
            type="submit"
            disabled={!connected || !newMessage.trim()}
            className="btn btn-coral px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="send-message-btn"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default RealtimeChat;
