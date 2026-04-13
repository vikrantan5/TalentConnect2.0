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
  Check,
  XCircle,
  Video
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

  // Load chats
  useEffect(() => {
    loadChats();
  }, []);

  // Handle URL chat param
  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chat');
    if (chatIdFromUrl && chats.length > 0) {
      const chatToOpen = chats.find(c => c.chat.id === chatIdFromUrl);
      if (chatToOpen) setActiveChat(chatToOpen);
    }
  }, [searchParams, chats]);

  // Socket events
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
    if (activeChat && isConnected) {
      joinChat(activeChat.chat.id);
      loadMessages(activeChat.chat.id, 1, true);
    }
    return () => {
      if (activeChat) leaveChat(activeChat.chat.id);
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
        // Preserve scroll position
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
      await axios.patch(`${BACKEND_URL}/api/free-sessions/${sessionId}`, 
        { status: action }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (activeChat) loadMessages(activeChat.chat.id, 1, true);
    } catch (error) {
      alert('Failed to update session');
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

  const extractSessionId = (text) => text.match(/\[Session ID: ([^\]]+)\]/)?.[1] || null;

   const getMessageText = (msg) => msg.text || msg.content || '';


  const isSessionMessage = (msg) => 
    ['session_request', 'session_update', 'meeting_link'].includes(msg.message_type);

  const filteredChats = chats.filter(chat => {
    const name = chat.other_user?.full_name || chat.other_user?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-[80vh]">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden h-[calc(100vh-12rem)] flex flex-col">

            <div className="flex h-full overflow-hidden">

              {/* ==================== LEFT: CONVERSATIONS LIST ==================== */}
              <div className={`w-full lg:w-5/12 xl:w-4/12 border-r border-gray-200 dark:border-gray-700 
                              flex flex-col overflow-hidden ${activeChat ? 'hidden lg:flex' : 'flex'}`}>

                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Messages
                    </h2>
                    {isConnected && <span className="text-xs text-green-600 flex items-center gap-1"><Circle className="w-2 h-2 fill-current" /> Live</span>}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Scrollable Chat List */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                  {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No conversations found</p>
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
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              {other?.profile_photo ? (
                                <img src={other.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                  <User className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <Circle className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{other?.full_name || other?.username}</h3>
                                {lastMsg && <span className="text-xs text-gray-500">{formatChatDate(lastMsg.created_at)}</span>}
                              </div>
                              {lastMsg && <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">{lastMsg.text}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ==================== RIGHT: CHAT WINDOW ==================== */}
              <div className={`flex-1 flex flex-col overflow-hidden ${!activeChat && 'hidden lg:flex'}`}>

                {activeChat ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3 flex-shrink-0">
                      <button onClick={() => setActiveChat(null)} className="lg:hidden p-2 -ml-2">
                        <ArrowLeft className="w-6 h-6" />
                      </button>
                      <div className="flex items-center gap-3">
                        {activeChat.other_user?.profile_photo ? (
                          <img src={activeChat.other_user.profile_photo} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{activeChat.other_user?.full_name || activeChat.other_user?.username}</h3>
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Circle className="w-2 h-2 fill-current" /> {typingUser ? 'Typing...' : 'Online'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages - Scrollable Area */}
                    <div 
                      ref={messagesContainerRef}
                      onScroll={handleScroll}
                      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
                    >
                      {messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id;
                        const isSessionMsg = isSessionMessage(msg);
                      
                             const msgText = getMessageText(msg);
                        const sessionId = extractSessionId(msgText);

                        return (
                          <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isSessionMsg 
                              ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' 
                              : isMe 
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                                : 'bg-white dark:bg-gray-800 shadow'}`}>
                               <p className="text-sm whitespace-pre-line break-words">{msg.text || msg.content || ''}</p>
                              <p className="text-xs mt-1 opacity-70">{formatTime(msg.created_at)}</p>

                              {/* Accept/Reject Buttons */}
                              {msg.message_type === 'session_request' && !isMe && sessionId && (
                                <div className="flex gap-2 mt-3">
                                  <button onClick={() => handleSessionAction(sessionId, 'accepted')} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium">Accept</button>
                                  <button onClick={() => handleSessionAction(sessionId, 'rejected')} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium">Reject</button>
                                </div>
                              )}

                              {/* Join Meeting Button */}
                              {msg.message_type === 'meeting_link' && (
                                 <a href={msgText.match(/https?:\/\/[^\s]+/)?.[0]} target="_blank" rel="noopener noreferrer" className="block mt-3">
                                  <button className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2">
                                    <Video className="w-4 h-4" /> Join Meeting
                                  </button>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {typingUser && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={handleMessageChange}
                          placeholder="Type a message..."
                          className="flex-1 px-5 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={!messageText.trim() || sending}
                          className="px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl disabled:opacity-50"
                        >
                          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <MessageCircle className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Select a conversation</h3>
                      <p className="text-gray-500 mt-2">Choose a chat from the list to start messaging</p>
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