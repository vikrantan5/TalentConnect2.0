import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { aiService } from '../services/apiService';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  MessageSquare,
  ThumbsUp,
  Copy,
  RefreshCw,
  X,
  HelpCircle,
  BookOpen,
  Code,
  Briefcase,
  Star
} from 'lucide-react';

// Helper function to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm TalentBot, your AI learning assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => generateUUID());
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setShowSuggestions(false);

    setMessages((prev) => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setLoading(true);
    try {
      const response = await aiService.sendMessage(userMessage, sessionId);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          isError: true
        },
      ]);
    }
    setLoading(false);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleNewChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm TalentBot, your AI learning assistant. How can I help you today?",
      timestamp: new Date(),
    }]);
    setShowSuggestions(true);
  };

  const quickQuestions = [
    { icon: Code, text: 'How do I start learning DSA?', accent: 'from-cyan-400 to-indigo-500' },
    { icon: Briefcase, text: 'Recommend skills for web dev', accent: 'from-emerald-400 to-cyan-500' },
    { icon: HelpCircle, text: 'What is skill verification?', accent: 'from-coral-400 to-pink-500' },
    { icon: Star, text: 'How does the marketplace work?', accent: 'from-amber-400 to-coral-400' },
  ];

  const suggestions = [
    'Python for beginners',
    'Best frontend frameworks',
    'Machine learning roadmap',
    'Cloud computing basics',
    'System design interview',
    'DevOps best practices'
  ];

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="chatbot-page">
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header — ink-navy hero */}
        <div className="relative mb-8 animate-scale-in">
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-6 md:p-8 shadow-soft-lg">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(600px 400px at 10% -10%, rgba(34,211,238,.28), transparent 60%), radial-gradient(600px 500px at 95% 110%, rgba(255,106,91,.22), transparent 60%)',
              }}
            />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-cyan-300 backdrop-blur-md">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full ring-2 ring-ink-950"></div>
                </div>
                <div>
                  <span className="chip chip-cyan mb-2"><Sparkles className="w-3 h-3" /> AI copilot</span>
                  <h1 className="font-display text-4xl md:text-5xl leading-[.95] tracking-tight">
                    Talent<span className="italic text-gradient-cyan">Bot</span>
                  </h1>
                  <p className="mt-2 text-ink-300 flex items-center gap-2 text-sm">
                    Your personalized AI learning assistant.
                  </p>
                </div>
              </div>
              <button
                onClick={handleNewChat}
                className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                New chat
              </button>
            </div>
          </div>
        </div>

        {/* Main Chat Container */}
        <div className="bento p-0 overflow-hidden flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-cyan-500" />
              <span className="font-semibold text-sm">AI conversation</span>
              <span className="chip chip-cyan">{sessionId.slice(0, 8)}…</span>
            </div>
          </div>

          {/* Messages Area - Fixed height with proper scrolling */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[500px]"
            style={{ height: '500px' }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}
                data-testid={`message-${message.role}`}
              >
                <div className={`flex max-w-[80%] gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-2xl grid place-items-center shadow-soft ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-white'
                      : 'bg-ink-950 text-cyan-300 ring-1 ring-white/10'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`relative group rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-soft'
                          : message.isError
                          ? 'bg-coral-100 text-coral-700 border border-coral-200 dark:bg-coral-500/10 dark:text-coral-300 dark:border-coral-500/20'
                          : 'glass border border-black/5 dark:border-white/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

                      {message.role === 'assistant' && !message.isError && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
                          >
                            <Copy className="w-3.5 h-3.5 text-ink-400" />
                          </button>
                          <button className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition">
                            <ThumbsUp className="w-3.5 h-3.5 text-ink-400" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`text-[10px] uppercase tracking-widest mt-1.5 text-ink-400 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-scale-in">
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-ink-950 ring-1 ring-white/10 text-cyan-300 rounded-2xl grid place-items-center shadow-soft">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="glass border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Panel */}
          {showSuggestions && messages.length === 1 && (
            <div className="border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-6 flex-shrink-0">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Try these
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(suggestion)}
                      className="btn btn-ghost text-xs px-3 py-2"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  Popular questions
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickQuestions.map((q, index) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(q.text)}
                        className="group bento p-4 text-left"
                      >
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${q.accent} grid place-items-center text-white shadow-soft transition-transform group-hover:scale-110`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold mt-3 leading-snug">{q.text}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-black/5 dark:border-white/10 p-4 flex-shrink-0" data-testid="chat-form">
            <div className="flex gap-3">
              <div className="flex-1 relative flex items-center rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about learning…"
                  className="flex-1 bg-transparent outline-none text-sm py-3"
                  disabled={loading}
                  data-testid="chat-input"
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="text-ink-400 hover:text-ink-900 dark:hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn btn-coral px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="send-button"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: 'Instant responses', desc: 'Get answers in real-time', iconBg: 'from-amber-400 to-coral-400' },
            { icon: BookOpen, title: 'Personalized learning', desc: 'Tailored to your goals', iconBg: 'from-cyan-400 to-indigo-500' },
            { icon: Sparkles, title: '24/7 availability', desc: 'Always here to help', iconBg: 'from-coral-400 to-pink-500' },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bento p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${feature.iconBg} text-white grid place-items-center shadow-soft shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-300">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;