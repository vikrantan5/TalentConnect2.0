import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import RealtimeChat from '../components/RealtimeChat';
import UserProfileModal from '../components/UserProfileModal';
import { taskService, sessionService } from '../services/apiService';
import { ArrowLeftRight, Plus, RefreshCw, CheckCircle, AlertCircle, MessageSquare, Calendar, X, User, Sparkles, Loader2 } from 'lucide-react';

const initialForm = {
  skill_offered: '',
  skill_requested: '',
  description: '',
};

const SkillExchangeMarketplace = () => {
  const { user } = useAuth();
  const getErrorMessage = (error, fallbackMessage) => {
    const detail = error?.response?.data?.detail;

    if (Array.isArray(detail)) {
      const joined = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.msg) return item.msg;
          return null;
        })
        .filter(Boolean)
        .join(' | ');

      return joined || fallbackMessage;
    }

    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') {
      return detail.msg || fallbackMessage;
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  };
  const [marketplaceTasks, setMarketplaceTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [showChat, setShowChat] = useState(false);
  const [chatTask, setChatTask] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTask, setMeetingTask] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    meeting_date: '',
    meeting_topic: '',
    meeting_duration_minutes: 60,
    meeting_link: ''
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const showToast = (message, type = 'success') => {
    const safeMessage = typeof message === 'string' ? message : String(message ?? 'Unexpected error');
    setToast({ show: true, message: safeMessage, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [marketData, mineData] = await Promise.all([
        taskService.getSkillExchangeTasks('open'),
        taskService.getMySkillExchangeTasks(),
      ]);
      setMarketplaceTasks(Array.isArray(marketData) ? marketData : []);
      setMyTasks(Array.isArray(mineData) ? mineData : []);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to load exchange tasks'), 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.createSkillExchangeTask(form);
      setForm(initialForm);
      showToast('Skill exchange task created successfully');
      await loadData();
      setActiveTab('my');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to create exchange task'), 'error');
    }
    setLoading(false);
  };

  const handleAccept = async (taskId) => {
    setLoading(true);
    try {
      await taskService.acceptSkillExchangeTask(taskId);
      showToast('Exchange matched successfully');
      await loadData();
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to accept exchange task'), 'error');
    }
    setLoading(false);
  };

  const handleOpenChat = (task) => {
    setChatTask(task);
    setShowChat(true);
  };

  const handleOpenMeeting = (task) => {
    setMeetingTask(task);
    setMeetingForm({
      meeting_date: '',
      meeting_topic: `${task.skill_offered} ↔ ${task.skill_requested} Session`,
      meeting_duration_minutes: 60,
      meeting_link: ''
    });
    setShowMeetingModal(true);
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sessionService.createSkillExchangeSession(
        meetingTask.id,
        meetingForm.meeting_date,
        meetingForm.meeting_topic,
        meetingForm.meeting_duration_minutes,
        meetingForm.meeting_link
      );
      showToast('Meeting scheduled successfully!');
      setShowMeetingModal(false);
      setMeetingTask(null);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to schedule meeting'), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="skill-exchange-page">
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 chip ${toast.type === 'success' ? 'chip-cyan' : 'chip-coral'} px-5 py-3 shadow-soft-lg backdrop-blur`} data-testid="skill-exchange-toast">
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header — ink-navy hero */}
        <div className="relative animate-scale-in">
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-8 md:p-10 shadow-soft-lg">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(600px 400px at 10% -10%, rgba(34,211,238,.28), transparent 60%), radial-gradient(600px 500px at 95% 110%, rgba(255,106,91,.22), transparent 60%)',
              }}
            />
            <div className="relative flex items-center justify-between flex-wrap gap-6">
              <div>
                <span className="chip chip-cyan mb-3"><ArrowLeftRight className="w-3 h-3" /> 1:1 trades</span>
                <h1 className="font-display text-5xl md:text-6xl leading-[.95] tracking-tight" data-testid="exchange-page-title">
                  Skill <span className="italic text-gradient">exchange</span><br />
                  <span className="italic text-gradient-cyan">marketplace</span>.
                </h1>
                <p className="mt-3 text-ink-300">Create exact swap listings: I teach X, I want Y.</p>
              </div>
              <button
                onClick={loadData}
                className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10"
                data-testid="exchange-refresh-button"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Create form */}
          <form onSubmit={handleCreate} className="lg:col-span-1 bento p-7 space-y-4" data-testid="exchange-create-form">
            <div>
              <span className="chip chip-coral mb-2"><Plus className="w-3 h-3" /> create</span>
              <h2 className="font-display text-3xl mt-2 leading-tight">
                New <span className="italic text-gradient">exchange</span>
              </h2>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Skill you offer</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                <input
                  value={form.skill_offered}
                  onChange={(e) => setForm({ ...form, skill_offered: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Python"
                  required
                  data-testid="exchange-offered-skill-input"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Skill you want</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                <input
                  value={form.skill_requested}
                  onChange={(e) => setForm({ ...form, skill_requested: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Flutter"
                  required
                  data-testid="exchange-requested-skill-input"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Description</span>
              <div className="mt-1.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-transparent outline-none text-sm resize-none"
                  placeholder="I can teach loops, APIs, and projects. Need Flutter basics in return."
                  data-testid="exchange-description-input"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-coral py-3 disabled:opacity-50"
              data-testid="exchange-create-submit-button"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Publish exchange
            </button>
          </form>

          {/* Listings panel */}
          <div className="lg:col-span-2 bento p-7">
            <div className="flex items-center gap-2 mb-6 border-b border-black/5 dark:border-white/10 pb-4 flex-wrap">
              <span className="chip chip-cyan mr-2"><Sparkles className="w-3 h-3" /> listings</span>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={activeTab === 'marketplace' ? 'btn btn-primary' : 'btn btn-ghost'}
                data-testid="exchange-marketplace-tab"
              >
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={activeTab === 'my' ? 'btn btn-primary' : 'btn btn-ghost'}
                data-testid="exchange-my-tab"
              >
                My listings
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12" data-testid="exchange-loading-state">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            ) : (
              <div className="space-y-3" data-testid="exchange-task-list">
                {(activeTab === 'marketplace' ? marketplaceTasks : myTasks).length === 0 ? (
                  <div className="empty-state" data-testid="exchange-empty-state">
                    <ArrowLeftRight className="w-10 h-10 text-ink-400" />
                    <p className="font-display text-2xl">No exchange tasks</p>
                    <p className="text-sm text-ink-500 max-w-sm">Create one above or check back later for new listings.</p>
                  </div>
                ) : (
                  (activeTab === 'marketplace' ? marketplaceTasks : myTasks).map((item) => {
                    const exchangeTask = item.task || item;
                    const creator = item.creator;
                    const isMatched = exchangeTask.status === 'matched';
                    const isMyTask = exchangeTask.creator_id === user?.id;
                    return (
                      <div key={exchangeTask.id} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-5 hover:shadow-soft transition" data-testid="exchange-task-card">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-[240px]">
                            <span className={`chip ${isMatched ? 'chip-coral' : 'chip-cyan'}`} data-testid="exchange-task-status">{exchangeTask.status}</span>
                            <h3 className="font-display text-2xl mt-2 leading-tight" data-testid="exchange-skill-pair">
                              {exchangeTask.skill_offered} <span className="text-gradient italic">↔</span> {exchangeTask.skill_requested}
                            </h3>
                            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1.5" data-testid="exchange-description-text">{exchangeTask.description || 'No description provided.'}</p>
                            {creator && (
                              <p className="text-xs text-ink-400 mt-2" data-testid="exchange-creator-text">
                                by {creator.full_name || creator.username}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {creator && !isMyTask && (
                              <button
                                onClick={() => {
                                  setSelectedUserId(creator.id || exchangeTask.creator_id);
                                  setShowProfileModal(true);
                                }}
                                className="btn btn-ghost"
                                data-testid="exchange-view-profile-button"
                              >
                                <User className="w-4 h-4" />
                                Profile
                              </button>
                            )}
                            {activeTab === 'marketplace' && exchangeTask.status === 'open' && !isMyTask && (
                              <button
                                onClick={() => handleAccept(exchangeTask.id)}
                                className="btn btn-cyan"
                                data-testid="exchange-accept-button"
                              >
                                Accept match
                              </button>
                            )}

                            {isMatched && (
                              <>
                                <button
                                  onClick={() => handleOpenChat(exchangeTask)}
                                  className="btn btn-ghost"
                                  data-testid="exchange-chat-button"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Chat
                                </button>
                                <button
                                  onClick={() => handleOpenMeeting(exchangeTask)}
                                  className="btn btn-coral"
                                  data-testid="exchange-schedule-button"
                                >
                                  <Calendar className="w-4 h-4" />
                                  Schedule
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && chatTask && (
        <div className="tc-modal-backdrop flex items-center justify-center p-4" data-testid="exchange-chat-modal">
          <div className="bg-white dark:bg-ink-900 rounded-[24px] shadow-soft-lg w-full max-w-2xl h-[600px] border border-black/10 dark:border-white/10 overflow-hidden">
            <RealtimeChat
              roomType="exchange"
              roomId={
                chatTask.reciprocal_task_id && chatTask.id > chatTask.reciprocal_task_id
                  ? chatTask.reciprocal_task_id
                  : chatTask.id
              }
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Meeting Scheduling Modal */}
      {showMeetingModal && meetingTask && (
        <div className="tc-modal-backdrop flex items-center justify-center p-4" onClick={() => setShowMeetingModal(false)} data-testid="exchange-meeting-modal">
          <div className="relative bg-white dark:bg-ink-900 rounded-[24px] shadow-soft-lg w-full max-w-md border border-black/10 dark:border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative bg-ink-950 text-white p-6 overflow-hidden">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    'radial-gradient(400px 200px at 10% 0%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 200px at 100% 100%, rgba(255,106,91,.25), transparent 60%)',
                }}
              />
              <div className="relative flex justify-between items-start">
                <div>
                  <span className="chip chip-cyan mb-2"><Calendar className="w-3 h-3" /> schedule</span>
                  <h2 className="font-display text-3xl leading-tight">Schedule meeting</h2>
                </div>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="w-9 h-9 rounded-full glass grid place-items-center text-white"
                  data-testid="meeting-modal-close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Meeting date & time</span>
                <div className="mt-1.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                  <input
                    type="datetime-local"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-transparent outline-none text-sm"
                    value={meetingForm.meeting_date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                    data-testid="meeting-date-input"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Meeting topic</span>
                <div className="mt-1.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent outline-none text-sm"
                    value={meetingForm.meeting_topic}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meeting_topic: e.target.value })}
                    data-testid="meeting-topic-input"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Duration (minutes)</span>
                <div className="mt-1.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                  <select
                    className="w-full bg-transparent outline-none text-sm"
                    value={meetingForm.meeting_duration_minutes}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meeting_duration_minutes: parseInt(e.target.value) })}
                    data-testid="meeting-duration-select"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Google Meet link</span>
                <div className="mt-1.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                  <input
                    type="url"
                    required
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={meetingForm.meeting_link}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })}
                    data-testid="meeting-link-input"
                  />
                </div>
                <p className="text-xs text-ink-400 mt-1.5">Create a Google Meet link and paste it here.</p>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="flex-1 btn btn-ghost py-3"
                  data-testid="meeting-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn btn-coral py-3 disabled:opacity-50"
                  data-testid="meeting-schedule-button"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scheduling…
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default SkillExchangeMarketplace;
