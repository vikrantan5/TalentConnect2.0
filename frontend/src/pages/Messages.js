import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  MessageCircle,
  Send,
  Search,
  User,
  Loader2,
  ArrowLeft,
  Circle,
  Video,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Messages = () => {
  const { user, darkMode } = useAuth();
  const { socket, isConnected, joinChat, leaveChat, sendMessage: socketSendMessage, sendTypingIndicator } = useSocket();
  const [searchParams] = useSearchParams();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [showMeetingInput, setShowMeetingInput] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chat');
    if (chatIdFromUrl && chats.length > 0) {
      const chatToOpen = chats.find(c => c.chat.id === chatIdFromUrl);
      if (chatToOpen) setActiveChat(chatToOpen);
    }
  }, [searchParams, chats]);

  useEffect(() => {
    const handleNewMessage = (event) => {
      const data = event.detail;
      if (activeChat && data.chat_id === activeChat.chat.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, {
            id: data.message.id,
            sender_id: data.message.sender_id,
            text: data.message.text || data.message.content || '',
            created_at: data.message.created_at,
            message_type: data.message.message_type
          }];
        });
        shouldAutoScrollRef.current = true;
        scrollToBottom();
      }
      loadChats();
    };

    const handleTyping = (event) => {
      const data = event.detail;
      if (activeChat && data.chat_id === activeChat.chat.id && data.user_id !== user?.id) {
        setTypingUser(data.is_typing ? data.user_id : null);
        if (data.is_typing) setTimeout(() => setTypingUser(null), 3000);
      }
    };

    window.addEventListener('new-message', handleNewMessage);
    window.addEventListener('user-typing', handleTyping);

    return () => {
      window.removeEventListener('new-message', handleNewMessage);
      window.removeEventListener('user-typing', handleTyping);
    };
  }, [activeChat, user]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.chat.id, 1, true);
      if (isConnected) {
        joinChat(activeChat.chat.id);
      }
    }
    return () => {
      if (activeChat && isConnected) leaveChat(activeChat.chat.id);
    };
  }, [activeChat, isConnected]);

  useEffect(() => {
    if (shouldAutoScrollRef.current) scrollToBottom();
  }, [messages]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || isLoadingMoreRef.current || !hasMoreMessages) return;
    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop < 100) loadMoreMessages();

    const isAtBottom = messagesContainerRef.current.scrollHeight - messagesContainerRef.current.scrollTop
      <= messagesContainerRef.current.clientHeight + 100;
    shouldAutoScrollRef.current = isAtBottom;
  }, [hasMoreMessages]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BACKEND_URL}/api/chat/my-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId, pageNum = 1, reset = true) => {
    try {
      if (reset) setLoadingMessages(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNum, limit: 50 }
      });

      const newMessages = response.data.messages || [];

      if (reset) {
        setMessages(newMessages);
        setPage(1);
        setHasMoreMessages(newMessages.length === 50);
        shouldAutoScrollRef.current = true;
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setPage(pageNum);
        setHasMoreMessages(newMessages.length === 50);
        if (messagesContainerRef.current) {
          const oldHeight = messagesContainerRef.current.scrollHeight;
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - oldHeight;
            }
          }, 50);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (reset) setLoadingMessages(false);
      isLoadingMoreRef.current = false;
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMoreRef.current || !hasMoreMessages || !activeChat) return;
    isLoadingMoreRef.current = true;
    await loadMessages(activeChat.chat.id, page + 1, false);
  };

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    if (activeChat && isConnected) {
      sendTypingIndicator(activeChat.chat.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(activeChat.chat.id, false), 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    setSending(true);
    const textToSend = messageText.trim();
    setMessageText('');

    try {
      if (isConnected && socket) {
        socketSendMessage(activeChat.chat.id, textToSend);
        setMessages(prev => [...prev, {
          id: Date.now(), // Add temporary ID
          sender_id: user?.id,
          text: textToSend,
          created_at: new Date().toISOString(),
          message_type: 'text'
        }]);
        shouldAutoScrollRef.current = true;
        scrollToBottom();
      } else {
        const token = localStorage.getItem('token');
        await axios.post(`${BACKEND_URL}/api/chat/${activeChat.chat.id}/send`,
          { text: textToSend },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        loadMessages(activeChat.chat.id, 1, true);
      }
    } catch (error) {
      console.error(error);
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  };

  const formatChatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return formatTime(timestamp);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSessionAction = async (sessionId, action) => {
    try {
      const token = localStorage.getItem('token');
      const payload = { status: action };

      if (action === 'accepted') {
        const link = window.prompt(
          'Paste the Google Meet link for this session (e.g. https://meet.google.com/xxx-yyyy-zzz):',
          'https://meet.google.com/'
        );
        if (link === null) return;
        const trimmed = (link || '').trim();
        if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
          alert('A valid meeting link is required to accept this session.');
          return;
        }
        payload.meeting_link = trimmed;
      }

      await axios.patch(
        `${BACKEND_URL}/api/free-sessions/${sessionId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (activeChat) loadMessages(activeChat.chat.id, 1, true);
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Failed to update session';
      alert(detail);
    }
  };

  const handleAddMeetingLink = async (sessionId) => {
    if (!meetingLink.trim()) return alert('Please enter meeting link');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${BACKEND_URL}/api/free-sessions/${sessionId}/meeting-link`,
        { meeting_link: meetingLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMeetingLink('');
      setShowMeetingInput({});
      if (activeChat) loadMessages(activeChat.chat.id, 1, true);
    } catch (error) {
      alert('Failed to add link');
    }
  };

  const extractSessionId = (text) => {
    const match = text.match(/\[Session ID: ([^\]]+)\]/); // Fixed regex
    return match ? match[1] : null;
  };
  
  const getMessageText = (msg) => msg.text || msg.content || '';


  
  // Properly extract a meeting URL even if `[Session ID: …]` is glued to it.
  // Stops on whitespace OR on the literal \"[Session\" marker that often follows.
  const extractMeetingLink = (text) => {
    if (!text) return null;
    const match = text.match(/https?:\/\/[^\s\[]+/);
    if (!match) return null;
    // Trim trailing punctuation like ),. or \"
    return match[0].replace(/[\),.\"'<>]+$/g, '');
  };

  const isValidUrl = (url) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_e) {
      return false;
    }
  };

  const isSessionMessage = (msg) =>
    ['session_request', 'session_update', 'meeting_link'].includes(msg.message_type);

  const filteredChats = chats.filter(chat => {
    const name = chat.other_user?.full_name || chat.other_user?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen relative aurora-bg grid-bg overflow-x-hidden text-ink-950 dark:text-white">
          <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
          <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
          <Navbar />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="flex flex-col items-center gap-5">
              <div className="tc-spinner" />
              <p className="font-display text-xl text-ink-600 dark:text-ink-200">Loading conversations…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen relative aurora-bg grid-bg overflow-x-hidden text-ink-950 dark:text-white">
        <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
        <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
        <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

        <div className="relative z-10">
          <Navbar />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bento p-0 overflow-x-hidden h-[calc(100vh-9rem)] flex flex-col">
            <div className="flex h-full overflow-hidden">

              {/* LEFT: Conversations */}
              <div className={`w-full lg:w-5/12 xl:w-4/12 border-r border-black/5 dark:border-white/10
                              flex flex-col overflow-hidden ${activeChat ? 'hidden lg:flex' : 'flex'}`}>

                <div className="p-5 border-b border-black/5 dark:border-white/10 flex-shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="chip chip-cyan mb-2"><Sparkles className="w-3 h-3" /> inbox</span>
                      <h2 className="font-display text-3xl leading-tight">
                        Your <span className="italic text-gradient-cyan">messages</span>
                      </h2>
                    </div>
                    {isConnected && (
                      <span className="chip chip-cyan">
                        <Circle className="w-2 h-2 fill-current" /> live
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                    <Search className="w-4 h-4 text-ink-400" />
                    <input
                      type="text"
                      placeholder="Search conversations…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm py-3 px-3"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <MessageCircle className="w-12 h-12 text-ink-300 mb-3" />
                      <p className="text-ink-500 font-display text-xl">No conversations found</p>
                    </div>
                  ) : (
                    filteredChats.map((chatItem) => {
                      const other = chatItem.other_user;
                      const lastMsg = chatItem.last_message;
                      const isActive = activeChat?.chat.id === chatItem.chat.id;

                      return (
                        <div
                          key={chatItem.chat.id}
                          onClick={() => setActiveChat(chatItem)}
                          className={`px-5 py-4 border-b border-black/5 dark:border-white/5 cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-all ${isActive ? 'bg-cyan-50/60 dark:bg-cyan-500/10 border-l-4 border-l-cyan-500' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              {other?.profile_photo ? (
                                <img src={other.profile_photo} alt="" className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/40" />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center shadow-soft">
                                  <User className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 ring-2 ring-white dark:ring-ink-900 rounded-full" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                <h3 className="font-semibold text-ink-950 dark:text-white truncate">{other?.full_name || other?.username}</h3>
                                {lastMsg && <span className="text-[10px] uppercase tracking-widest text-ink-400">{formatChatDate(lastMsg.created_at)}</span>}
                              </div>
                              {lastMsg && <p className="text-sm text-ink-500 dark:text-ink-300 truncate mt-0.5">{lastMsg.text}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT: Chat */}
              <div className={`flex-1 flex flex-col overflow-hidden ${!activeChat && 'hidden lg:flex'}`}>
                {activeChat ? (
                  <>
                    <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center gap-3 flex-shrink-0 glass-strong">
                      <button onClick={() => setActiveChat(null)} className="lg:hidden p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-3">
                        {activeChat.other_user?.profile_photo ? (
                          <img src={activeChat.other_user.profile_photo} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center shadow-soft">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{activeChat.other_user?.full_name || activeChat.other_user?.username}</h3>
                          <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-semibold uppercase tracking-widest">
                            <Circle className="w-1.5 h-1.5 fill-current" /> {typingUser ? 'Typing…' : 'Online'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={messagesContainerRef}
                      onScroll={handleScroll}
                      className="flex-1 overflow-y-auto p-5 space-y-3"
                    >
                      {messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id;
                        const isSessionMsg = isSessionMessage(msg);
                        const msgText = getMessageText(msg);
                        const sessionId = extractSessionId(msgText);

                        return (
                          <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-soft ${
                              isSessionMsg
                                ? 'bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200/60 dark:border-cyan-400/20'
                                : isMe
                                  ? 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-white'
                                  : 'glass border border-black/5 dark:border-white/10'
                            }`}>
                              <p className="text-sm whitespace-pre-line break-words">{msgText}</p>
                              <p className={`text-[10px] uppercase tracking-widest mt-1.5 ${isMe ? 'text-white/70' : 'text-ink-400'}`}>
                                {formatTime(msg.created_at)}
                              </p>

                              {msg.message_type === 'session_request' && !isMe && sessionId && (
                                <div className="flex gap-2 mt-3">
                                  <button onClick={() => handleSessionAction(sessionId, 'accepted')} className="flex-1 btn btn-cyan py-2 text-xs">Accept</button>
                                  <button onClick={() => handleSessionAction(sessionId, 'rejected')} className="flex-1 btn btn-coral py-2 text-xs">Reject</button>
                                </div>
                              )}

                              {msg.message_type === 'meeting_link' && (() => {
                                const meetingUrl = extractMeetingLink(msgText);
                                if (!isValidUrl(meetingUrl)) {
                                  return (
                                    <div className="mt-3 text-xs text-coral-500">
                                      Meeting link is invalid. Please ask the mentor to resend.
                                    </div>
                                  );
                                }
                                return (
                                  <a
                                    href={meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-3"
                                    data-testid="message-join-meeting-link"
                                  >
                                    <button className="w-full btn btn-coral py-2 text-xs">
                                      <Video className="w-3.5 h-3.5" /> Join meeting
                                    </button>
                                  </a>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}

                      {typingUser && (
                        <div className="flex justify-start">
                          <div className="glass border border-black/5 dark:border-white/10 px-4 py-3 rounded-2xl rounded-bl-none">
                            <div className="flex gap-1.5">
                              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '.15s' }}></div>
                              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '.3s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-black/5 dark:border-white/10 flex-shrink-0 glass-strong">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <div className="flex-1 flex items-center rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                          <input
                            type="text"
                            value={messageText}
                            onChange={handleMessageChange}
                            placeholder="Type a message…"
                            className="flex-1 bg-transparent outline-none text-sm py-3"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!messageText.trim() || sending}
                          className="btn btn-coral px-6 disabled:opacity-50"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div className="empty-state max-w-md">
                      <MessageCircle className="w-12 h-12 text-ink-400" />
                      <p className="font-display text-3xl">Select a conversation</p>
                      <p className="text-sm text-ink-500">Choose a chat from the list to start messaging.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;