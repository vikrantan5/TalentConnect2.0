import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  MessageCircle, 
  Send, 
  Search, 
  User, 
  Loader2,
  X,
  ArrowLeft,
   Circle,
  Check,
  XCircle,
  Video,
  Calendar
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Messages = () => {
  const { user, darkMode } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.chat.id);
      connectWebSocket(activeChat.chat.id);
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/chat/my-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const connectWebSocket = (chatId) => {
    if (ws) {
      ws.close();
    }

    const token = localStorage.getItem('token');
    const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const websocket = new WebSocket(`${wsUrl}/api/chat/ws/${chatId}?token=${token}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            sender_id: data.sender_id,
            text: data.text,
            created_at: data.created_at
          }]);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    setSending(true);
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ text: messageText }));
        setMessageText('');
      } else {
        // Fallback to REST API if WebSocket is not connected
        const token = localStorage.getItem('token');
        await axios.post(
          `${BACKEND_URL}/api/chat/${activeChat.chat.id}/send`,
          { text: messageText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessageText('');
        await loadMessages(activeChat.chat.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(timestamp);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  
  const handleSessionAction = async (sessionId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BACKEND_URL}/api/free-sessions/${sessionId}`,
        { status: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Reload messages to show updated status
      if (activeChat) {
        await loadMessages(activeChat.chat.id);
      }
      alert(`Session ${action}!`);
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Failed to update session. Please try again.');
    }
  };

  const handleAddMeetingLink = async (sessionId) => {
    if (!meetingLink.trim()) {
      alert('Please enter a valid meeting link');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BACKEND_URL}/api/free-sessions/${sessionId}/meeting-link`,
        { meeting_link: meetingLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMeetingLink('');
      setShowMeetingInput({});
      
      // Reload messages to show the link
      if (activeChat) {
        await loadMessages(activeChat.chat.id);
      }
      
      alert('Meeting link added successfully!');
    } catch (error) {
      console.error('Error adding meeting link:', error);
      alert('Failed to add meeting link. Please try again.');
    }
  };

  const extractSessionId = (text) => {
    const match = text.match(/\[Session ID: ([^\]]+)\]/);
    return match ? match[1] : null;
  };

  const isSessionMessage = (message) => {
    return message.message_type === 'session_request' || 
           message.message_type === 'session_update' || 
           message.message_type === 'meeting_link';
  };

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.other_user;
    if (!otherUser) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser.full_name?.toLowerCase().includes(searchLower) ||
      otherUser.username?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading chats...</p>
            </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              
              {/* Conversations List */}
              <div className={`border-r border-gray-200 dark:border-gray-700 ${activeChat && 'hidden md:block'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    Messages
                  </h2>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Chat List */}
                <div className="overflow-y-auto h-[calc(100%-10rem)]">
                  {filteredChats.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Start chatting from the Matches page
                      </p>
                    </div>
                  ) : (
                    filteredChats.map((chatItem) => {
                      const otherUser = chatItem.other_user;
                      const lastMessage = chatItem.last_message;
                      const isActive = activeChat?.chat.id === chatItem.chat.id;

                      return (
                        <div
                          key={chatItem.chat.id}
                          onClick={() => setActiveChat(chatItem)}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-l-4 border-l-indigo-600' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              {otherUser?.profile_photo || otherUser?.avatar_url ? (
                                <img 
                                  src={otherUser.profile_photo || otherUser.avatar_url} 
                                  alt={otherUser.full_name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                  <User className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {otherUser?.full_name || otherUser?.username || 'User'}
                                </h3>
                                {lastMessage && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatChatDate(lastMessage.created_at)}
                                  </span>
                                )}
                              </div>
                              {lastMessage && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {lastMessage.text}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className={`col-span-2 flex flex-col ${!activeChat && 'hidden md:flex'}`}>
                {activeChat ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveChat(null)}
                          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        {activeChat.other_user?.profile_photo || activeChat.other_user?.avatar_url ? (
                          <img 
                            src={activeChat.other_user.profile_photo || activeChat.other_user.avatar_url} 
                            alt={activeChat.other_user.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {activeChat.other_user?.full_name || activeChat.other_user?.username || 'User'}
                          </h3>
                          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Circle className="w-2 h-2 fill-green-500" />
                            Online
                          </p>
                        </div>
                      </div>
                    </div>

                                   {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                      {messages.map((message, idx) => {
                        const isMe = message.sender_id === user?.id;
                        const sessionId = extractSessionId(message.text);
                        const isSessionRequest = message.message_type === 'session_request';
                        const isSessionUpdate = message.message_type === 'session_update';
                        const isMeetingLink = message.message_type === 'meeting_link';
                        const isSessionMsg = isSessionMessage(message);

                        return (
                          <div
                            key={idx}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                isSessionMsg
                                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 text-gray-900 dark:text-white'
                                  : isMe
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-md'
                              }`}
                            >
                              <p className="text-sm break-words whitespace-pre-line">{message.text}</p>
                              <p className={`text-xs mt-1 ${isSessionMsg ? 'text-gray-600 dark:text-gray-400' : isMe ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                {formatTime(message.created_at)}
                              </p>

                              {/* Session Request Actions - Only for receiver */}
                              {isSessionRequest && !isMe && sessionId && (
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => handleSessionAction(sessionId, 'accepted')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                                  >
                                    <Check className="w-4 h-4" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleSessionAction(sessionId, 'rejected')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                </div>
                              )}

                              {/* Add Meeting Link Button - For accepted sessions */}
                              {isSessionUpdate && sessionId && message.text.includes('ACCEPTED') && (
                                <div className="mt-3">
                                  {showMeetingInput[sessionId] ? (
                                    <div className="space-y-2">
                                      <input
                                        type="url"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="Enter Google Meet link..."
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleAddMeetingLink(sessionId)}
                                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                                        >
                                          <Video className="w-4 h-4" />
                                          Add Link
                                        </button>
                                        <button
                                          onClick={() => setShowMeetingInput({})}
                                          className="px-3 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg text-sm"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShowMeetingInput({ [sessionId]: true })}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
                                    >
                                      <Video className="w-4 h-4" />
                                      Add Google Meet Link
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Display Meeting Link - Make it clickable */}
                              {isMeetingLink && (
                                <div className="mt-3">
                                  <a
                                    href={message.text.match(/(https?:\/\/[^\s]+)/)?.[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all"
                                  >
                                    <Video className="w-4 h-4" />
                                    Join Meeting
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          disabled={!messageText.trim() || sending}
                          className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
                        >
                          {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Choose a chat from the list to start messaging
                      </p>
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
