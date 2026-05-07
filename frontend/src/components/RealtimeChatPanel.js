import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, Wifi, WifiOff, MessageCircle } from 'lucide-react';
import { realtimeService } from '../services/apiService';

const RealtimeChatPanel = ({ roomType, roomId, currentUserId, title = 'Realtime Chat' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!roomType || !roomId || !token) return undefined;
    let isMounted = true;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await realtimeService.getHistory(roomType, roomId);
        if (!isMounted) return;
        setMessages(response.messages || []);
      } catch (error) {
        if (!isMounted) return;
        setConnectionError(error?.response?.data?.detail || 'Unable to load chat history');
      }
      setLoadingHistory(false);
    };

    const connect = () => {
      try {
        const wsUrl = realtimeService.buildWebSocketUrl(roomType, roomId, token);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => { if (isMounted) { setConnected(true); setConnectionError(''); } };
        ws.onclose = () => { if (isMounted) setConnected(false); };
        ws.onerror = () => { if (isMounted) setConnectionError('Live chat connection failed'); };
        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload?.event === 'error') { setConnectionError(payload?.detail || 'Realtime message error'); return; }
            setMessages((prev) => [...prev, payload]);
          } catch (_e) { /* */ }
        };
      } catch (_e) {
        setConnectionError('Unable to initialize live chat');
      }
    };

    loadHistory();
    connect();

    return () => {
      isMounted = false;
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [roomType, roomId, token]);

  const handleSend = () => {
    const safeContent = input.trim();
    if (!safeContent || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content: safeContent, message_type: 'text' }));
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="bento p-0 overflow-hidden" data-testid="realtime-chat-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 glass-strong flex items-center justify-between" data-testid="realtime-chat-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-ink-950 ring-1 ring-white/10 grid place-items-center text-cyan-300">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm" data-testid="realtime-chat-title">{title}</p>
            <p className="text-[10px] uppercase tracking-widest text-ink-500" data-testid="realtime-chat-room-label">
              {roomType}:{String(roomId).slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs" data-testid="realtime-connection-status">
          {connected ? (
            <span className="chip chip-cyan"><Wifi className="w-3 h-3" />live</span>
          ) : (
            <span className="chip chip-coral"><WifiOff className="w-3 h-3" />offline</span>
          )}
        </div>
      </div>

      {connectionError && (
        <div className="px-4 py-2 text-xs bg-coral-500/10 text-coral-700 dark:text-coral-300 border-b border-coral-500/20" data-testid="realtime-chat-error">
          {connectionError}
        </div>
      )}

      <div className="h-64 overflow-y-auto p-4 space-y-3" data-testid="realtime-chat-messages">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8" data-testid="realtime-chat-loading">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-8" data-testid="realtime-chat-empty">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((message, index) => {
            const isMine = message.sender_id === currentUserId;
            const isSystem = message.message_type === 'system';
            if (isSystem) {
              return (
                <div key={message.id || index} className="text-center" data-testid="realtime-system-message">
                  <span className="chip chip-ink text-[10px]">{message.sender_id?.slice(0, 6)} {message.content}</span>
                </div>
              );
            }
            return (
              <div key={message.id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} data-testid="realtime-chat-message-item">
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-soft ${
                  isMine
                    ? 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-white'
                    : 'glass border border-black/5 dark:border-white/10'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words" data-testid="realtime-chat-message-content">{message.content}</p>
                  <p className={`text-[10px] uppercase tracking-widest mt-1.5 ${isMine ? 'text-white/70' : 'text-ink-400'}`} data-testid="realtime-chat-message-time">
                    {message.created_at ? new Date(message.created_at).toLocaleTimeString() : 'now'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-black/5 dark:border-white/10 glass-strong flex items-end gap-2" data-testid="realtime-chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Type your message…"
          className="modern-input flex-1 resize-none"
          data-testid="realtime-chat-input"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          className="btn btn-coral px-4 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="realtime-chat-send-button"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
};

export default RealtimeChatPanel;
