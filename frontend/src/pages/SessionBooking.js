import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { sessionService, ratingService } from '../services/apiService';
import RealtimeChat from '../components/RealtimeChat';
import UserProfileModal from '../components/UserProfileModal';
import RatingModal from '../components/RatingModal';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Video,
  User,
  Star,
  CheckCircle,
  Loader2,
  Calendar as CalendarIcon,
  Filter,
  Search,
  RefreshCw,
  Download,
  X,
  Link as LinkIcon,
  Copy,
  Check,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Video as VideoIcon,
  BookOpen,
  Sparkles,
  ArrowRight,
  Grid as GridIcon,
  List as ListIcon,
} from 'lucide-react';

const SessionBooking = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('grid');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [meetingModal, setMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    provider: 'google_meet',
    date: '',
    time: '',
    duration_minutes: 60,
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    scheduled: 0,
    cancelled: 0,
    pending: 0,
  });

  const [showChat, setShowChat] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSessionData, setRatingSessionData] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      const newStats = {
        total: sessions.length,
        completed: sessions.filter((s) => s.status === 'completed').length,
        scheduled: sessions.filter((s) => s.status === 'scheduled').length,
        cancelled: sessions.filter((s) => s.status === 'cancelled').length,
        pending: sessions.filter((s) => s.status === 'pending').length,
      };
      setStats(newStats);
    }
  }, [sessions]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [learningSessionsData, exchangeSessionsData] = await Promise.all([
        sessionService.getMySessions().catch(() => []),
        sessionService.getSkillExchangeSessions().catch(() => []),
      ]);

      const normalizedLearningSessions = Array.isArray(learningSessionsData)
        ? learningSessionsData.map((item) => {
            if (item?.session) {
              return {
                ...item.session,
                role: item.role,
                mentor_name: item.mentor?.full_name || item.mentor?.username,
                learner_name: item.learner?.full_name || item.learner?.username,
                session_type: 'learning',
              };
            }
            return { ...item, session_type: 'learning' };
          })
        : [];

      const normalizedExchangeSessions = Array.isArray(exchangeSessionsData)
        ? exchangeSessionsData.map((item) => {
            const session = item.session || item;
            const otherParticipant = item.other_participant;
            const task = item.task;
            return {
              ...session,
              session_type: 'skill_exchange',
              other_participant_name: otherParticipant?.full_name || otherParticipant?.username,
              other_participant_photo: otherParticipant?.profile_photo,
              other_participant_id: otherParticipant?.id,
              skill_offered: task?.skill_offered,
              skill_requested: task?.skill_requested,
            };
          })
        : [];

      const allSessions = [...normalizedLearningSessions, ...normalizedExchangeSessions];
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
    setLoading(false);
  };

  const handleMarkComplete = async (session) => {
    try {
      setLoading(true);
      const result = await sessionService.markSessionComplete(session.id);
      toast.success(result.message);
      await loadSessions();
      if (result.can_rate) {
        setRatingSessionData({
          sessionId: session.id,
          receiverId: session.other_participant_id,
          receiverName: session.other_participant_name,
        });
        setShowRatingModal(true);
      }
    } catch (error) {
      console.error('Error marking session complete:', error);
      toast.error(error.response?.data?.detail || 'Failed to mark session complete');
    } finally {
      setLoading(false);
    }
  };

  /**
   * NEW FLOW: When user clicks "Join Meeting", mark the session as attended
   * immediately. This auto-completes the session, updates leaderboard, and
   * enables the "Rate Session" button. Works for ALL session types:
   *  - skill_exchange (1:1 trades, skill exchange marketplace)
   *  - learning (mentor bookings, marketplace bookings, AI matching)
   */
  const handleJoinMeeting = async (session) => {
    try {
      if (session.session_type === 'skill_exchange') {
        await sessionService.markSkillExchangeAttended(session.id);
      } else {
        await sessionService.markLearningSessionAttended(session.id);
      }
      // Refresh so the "Rate" button appears
      loadSessions();
    } catch (error) {
      // Non-blocking: still let the user open the meeting even if tracking fails
      console.error('Attendance tracking failed:', error);
    }
  };

  const handleRatePartner = (session) => {
    // Determine the rating target for ANY session type
    let receiverId = session.other_participant_id;
    let receiverName = session.other_participant_name;
    if (session.session_type !== 'skill_exchange') {
      // Learning session: rate the opposite role
      if (session.role === 'mentor') {
        receiverId = session.learner_id;
        receiverName = session.learner_name || 'Learner';
      } else {
        receiverId = session.mentor_id;
        receiverName = session.mentor_name || 'Mentor';
      }
    }
    setRatingSessionData({
      sessionId: session.id,
      receiverId,
      receiverName,
    });
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => {
    toast.success('Rating submitted successfully! Thank you for your feedback.');
    loadSessions();
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openMeetingModal = (session) => {
    setSelectedSession(session);
    const scheduleDate = session?.scheduled_at ? new Date(session.scheduled_at) : null;
    setMeetingForm({
      provider: 'google_meet',
      date: scheduleDate ? scheduleDate.toISOString().slice(0, 10) : '',
      time: scheduleDate ? scheduleDate.toISOString().slice(11, 16) : '',
      duration_minutes: session?.duration_minutes || 60,
    });
    setMeetingModal(true);
  };

  const handleSaveMeetingLink = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const generated = await sessionService.generateMeetingLink(
        meetingForm.provider,
        selectedSession.skill_name || 'TalentConnect Session'
      );

      const payload = {
        meeting_link: generated.meeting_link,
        duration_minutes: Number(meetingForm.duration_minutes || 60),
      };

      if (meetingForm.date && meetingForm.time) {
        payload.scheduled_at = new Date(`${meetingForm.date}T${meetingForm.time}:00`).toISOString();
      }

      await sessionService.updateSession(selectedSession.id, payload);
      setMeetingModal(false);
      await loadSessions();
    } catch (error) {
      console.error('Meeting link setup failed:', error);
    }
    setLoading(false);
  };

  const getStatusMeta = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, label: 'Completed', tint: 'from-emerald-400 to-cyan-500', text: 'text-emerald-500' };
      case 'scheduled':
        return { icon: CalendarCheck, label: 'Scheduled', tint: 'from-cyan-400 to-indigo-500', text: 'text-cyan-500' };
      case 'cancelled':
        return { icon: CalendarX, label: 'Cancelled', tint: 'from-coral-400 to-coral-600', text: 'text-coral-500' };
      default:
        return { icon: CalendarClock, label: status || 'Pending', tint: 'from-amber-300 to-coral-400', text: 'text-amber-500' };
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (filter !== 'all' && session.status !== filter) return false;
    if (searchTerm) {
      return (
        session.skill_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.mentor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const quickStats = [
    { label: 'Total Sessions', value: stats.total, icon: Calendar, iconBg: 'from-indigo-400 to-indigo-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, iconBg: 'from-emerald-400 to-cyan-500' },
    { label: 'Scheduled', value: stats.scheduled, icon: CalendarCheck, iconBg: 'from-cyan-400 to-cyan-600' },
    { label: 'Pending', value: stats.pending, icon: CalendarClock, iconBg: 'from-amber-300 to-coral-400' },
  ];

  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled').slice(0, 3);

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="session-booking-page">
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero header — ink-navy */}
        <div className="relative mb-10 animate-scale-in">
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
                <span className="chip chip-cyan mb-3"><Sparkles className="w-3 h-3" /> sessions</span>
                <h1 className="font-display text-5xl md:text-6xl leading-[.95] tracking-tight">
                  My <span className="italic text-gradient">sessions</span>,<br />
                  <span className="italic text-gradient-cyan">on track</span>.
                </h1>
                <p className="mt-3 text-ink-300">Manage your learning sessions and track progress.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView(view === 'list' ? 'grid' : 'list')}
                  className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10"
                >
                  {view === 'list' ? <GridIcon className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                  {view === 'list' ? 'Grid' : 'List'}
                </button>
                <button
                  onClick={loadSessions}
                  className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bento bento-glow p-6 animate-scale-in"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.iconBg} text-white grid place-items-center shadow-soft`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">{stat.label}</p>
                <p className="font-display text-5xl mt-1 leading-none">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Upcoming Sessions Banner */}
        {upcomingSessions.length > 0 && (
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-6 md:p-8 mb-8 shadow-soft-lg">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(500px 300px at 10% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 300px at 100% 110%, rgba(255,106,91,.22), transparent 60%)',
              }}
            />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center backdrop-blur-md">
                  <Calendar className="w-7 h-7 text-cyan-300" />
                </div>
                <div>
                  <span className="chip chip-cyan mb-2">upcoming</span>
                  <h3 className="font-display text-2xl md:text-3xl leading-tight">
                    {upcomingSessions.length} session{upcomingSessions.length !== 1 ? 's' : ''} <span className="italic text-gradient-cyan">scheduled</span>
                  </h3>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {upcomingSessions.map((session, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSession(session);
                      setShowDetails(true);
                    }}
                    className="chip chip-ink ring-1 ring-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    {new Date(session.scheduled_at).toLocaleDateString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bento p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search sessions by skill or mentor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
              >
                <option value="all">All Sessions</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>

              <button className="btn btn-ghost p-3" title="Filter">
                <Filter className="w-4 h-4" />
              </button>

              <button className="btn btn-ghost p-3" title="Download">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-5">
              <div className="tc-spinner" />
              <p className="font-display text-xl text-ink-600 dark:text-ink-200">Loading your sessions…</p>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state" data-testid="no-sessions">
            <Calendar className="w-12 h-12 text-ink-400" />
            <p className="font-display text-3xl">No sessions found</p>
            <p className="text-sm text-ink-500 max-w-sm">
              {searchTerm || filter !== 'all'
                ? 'No sessions match your search criteria. Try adjusting your filters.'
                : "You don't have any sessions yet. Start by exploring mentors and booking your first session!"}
            </p>
            <div className="flex gap-3 mt-2">
              <button className="btn btn-cyan">
                Browse Mentors <ArrowRight className="w-4 h-4" />
              </button>
              {(searchTerm || filter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                  }}
                  className="btn btn-ghost"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
            {filteredSessions.map((session) => {
              const meta = getStatusMeta(session.status);
              const StatusIcon = meta.icon;

              return (
                <div
                  key={session.id}
                  className="bento bento-glow p-0 overflow-hidden flex flex-col"
                  data-testid="session-card"
                >
                  {/* Card top — ink-navy */}
                  <div className="relative overflow-hidden bg-ink-950 text-white p-6">
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        background:
                          'radial-gradient(400px 240px at 0% 0%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 240px at 100% 100%, rgba(255,106,91,.22), transparent 60%)',
                      }}
                    />
                    <div className="relative flex justify-between items-start mb-3">
                      <span className="chip chip-cyan text-[10px]">
                        Session #{session.id?.slice(0, 8)}
                      </span>
                      <span className={`chip ${session.status === 'completed' ? 'chip-cyan' : session.status === 'cancelled' ? 'chip-coral' : 'chip-ink'} ring-1 ring-white/15 bg-white/10`}>
                        <StatusIcon className="w-3 h-3" /> {meta.label}
                      </span>
                    </div>
                    <div className="relative">
                      <h3 className="font-display text-2xl leading-tight">{session.skill_name}</h3>
                      <p className="text-ink-300 text-sm mt-1">with {session.mentor_name || session.other_participant_name || 'Mentor'}</p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 flex-1">
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-sm text-ink-600 dark:text-ink-300">
                        <Clock className="w-4 h-4 text-ink-400" />
                        <span>Duration: {session.meeting_duration_minutes || session.duration_minutes || 60} minutes</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-ink-600 dark:text-ink-300">
                        <CalendarIcon className="w-4 h-4 text-ink-400" />
                        <span>
                          {session.meeting_date
                            ? new Date(session.meeting_date).toLocaleString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : session.scheduled_at
                            ? new Date(session.scheduled_at).toLocaleString()
                            : 'Not scheduled'}
                        </span>
                      </div>

                      {session.meeting_link && (
                        <div className="flex items-center gap-3 text-sm text-ink-600 dark:text-ink-300">
                          <VideoIcon className="w-4 h-4 text-ink-400" />
                          <span className="truncate flex-1">{session.meeting_link}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(session.meeting_link);
                            }}
                            className="w-8 h-8 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10 transition"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-ink-400" />}
                          </button>
                        </div>
                      )}

                      {session.meeting_topic && (
                        <div className="flex items-center gap-3 text-sm text-ink-600 dark:text-ink-300">
                          <BookOpen className="w-4 h-4 text-ink-400" />
                          <span>{session.meeting_topic}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {session.meeting_link && (session.status === 'scheduled' || session.status === 'accepted' || session.status === 'completed') && (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleJoinMeeting(session)}
                          className="btn btn-cyan flex-1 min-w-[120px]"
                          data-testid="join-meeting-button"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      )}

                      {!session.meeting_link && session.role === 'mentor' && (
                        <button
                          onClick={() => openMeetingModal(session)}
                          className="btn btn-cyan flex-1 min-w-[120px]"
                          data-testid="session-set-meeting-link-button"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Set Meeting Link
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setShowDetails(true);
                        }}
                        className="btn btn-ghost"
                      >
                        Details
                      </button>

                      {/* Rate button — appears for ANY completed session (1:1 / skill exchange / marketplace / AI matching) */}
                      {session.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRatePartner(session);
                          }}
                          className="btn btn-coral flex-1 min-w-[140px]"
                          data-testid="rate-partner-button"
                        >
                          <Star className="w-4 h-4" />
                          Rate Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Session Details Modal */}
        {showDetails && selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetails(false)}>
            <div className="bento p-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header — ink-navy */}
              <div className="relative overflow-hidden bg-ink-950 text-white p-6 md:p-8 rounded-t-[28px]">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      'radial-gradient(500px 300px at 10% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 240px at 100% 110%, rgba(255,106,91,.22), transparent 60%)',
                  }}
                />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-3">session details</span>
                    <h3 className="font-display text-3xl md:text-4xl leading-tight">{selectedSession.skill_name}</h3>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-9 h-9 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-display text-2xl flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-500" />
                      Information
                    </h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-ink-500 dark:text-ink-300">Status</span>
                        <span className="chip chip-ink capitalize">{selectedSession.status}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-ink-500 dark:text-ink-300">Duration</span>
                        <span className="font-semibold">{selectedSession.duration_minutes} minutes</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-ink-500 dark:text-ink-300">Scheduled</span>
                        <span className="font-semibold text-right">
                          {selectedSession.scheduled_at ? new Date(selectedSession.scheduled_at).toLocaleString() : 'Not scheduled'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-ink-500 dark:text-ink-300">Created</span>
                        <span className="font-semibold">{new Date(selectedSession.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display text-2xl flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-500" />
                      Mentor
                    </h4>

                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white font-bold text-xl">
                        {selectedSession.mentor_name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedSession.mentor_name || 'Mentor'}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-300">ID: {selectedSession.mentor_id?.slice(0, 8)}</p>
                      </div>
                    </div>

                    {selectedSession.meeting_link && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-widest text-ink-500">Meeting Link</p>
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                          <LinkIcon className="w-4 h-4 text-ink-400 flex-shrink-0" />
                          <span className="text-sm truncate flex-1 text-ink-600 dark:text-ink-200">{selectedSession.meeting_link}</span>
                          <button
                            onClick={() => handleCopyLink(selectedSession.meeting_link)}
                            className="w-8 h-8 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10 transition"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-ink-400" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex-wrap">
                  {selectedSession.meeting_link && (selectedSession.status === 'scheduled' || selectedSession.status === 'accepted' || selectedSession.status === 'completed') && (
                    <a
                      href={selectedSession.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleJoinMeeting(selectedSession)}
                      className="btn btn-cyan flex-1 min-w-[140px]"
                      data-testid="details-join-meeting-button"
                    >
                      <Video className="w-4 h-4" />
                      Join Meeting
                    </a>
                  )}

                  {selectedSession.status === 'completed' && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        handleRatePartner(selectedSession);
                      }}
                      className="btn btn-coral flex-1 min-w-[140px]"
                      data-testid="details-rate-button"
                    >
                      <Star className="w-4 h-4" />
                      Rate Session
                    </button>
                  )}

                  {selectedSession && !selectedSession.meeting_link && selectedSession.role === 'mentor' && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        openMeetingModal(selectedSession);
                      }}
                      className="btn btn-cyan flex-1 min-w-[140px]"
                      data-testid="details-set-meeting-link-button"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Set Meeting Link
                    </button>
                  )}

                  <button className="btn btn-ghost flex-1 min-w-[140px]">Reschedule</button>

                  {selectedSession.status !== 'cancelled' && (
                    <button className="btn btn-ghost text-coral-500 border-coral-300/50">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Link Modal */}
        {meetingModal && selectedSession && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMeetingModal(false)}
            data-testid="meeting-link-setup-modal"
          >
            <div className="bento p-0 max-w-md w-full bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden bg-ink-950 text-white p-6 rounded-t-[28px]">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      'radial-gradient(400px 240px at 10% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 240px at 100% 110%, rgba(255,106,91,.22), transparent 60%)',
                  }}
                />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-2">setup</span>
                    <h2 className="font-display text-3xl">Set Meeting Link</h2>
                  </div>
                  <button
                    onClick={() => setMeetingModal(false)}
                    className="w-9 h-9 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Provider</label>
                  <select
                    value={meetingForm.provider}
                    onChange={(e) => setMeetingForm({ ...meetingForm, provider: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    data-testid="meeting-provider-select"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="webrtc">WebRTC Room</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Date</label>
                    <input
                      type="date"
                      value={meetingForm.date}
                      onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                      data-testid="meeting-date-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Time</label>
                    <input
                      type="time"
                      value={meetingForm.time}
                      onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                      data-testid="meeting-time-input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setMeetingModal(false)}
                    className="btn btn-ghost flex-1"
                    data-testid="meeting-modal-cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMeetingLink}
                    className="btn btn-cyan flex-1"
                    data-testid="meeting-modal-save-button"
                  >
                    Save Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal for Sessions */}
      {showChat && chatSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bento p-0 w-full max-w-2xl h-[600px] bg-white dark:bg-gray-900 overflow-hidden">
            <RealtimeChat roomType="session" roomId={chatSession.id} onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}

      {/* User Profile Modal */}
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

      {/* Rating Modal */}
      {showRatingModal && ratingSessionData && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingSessionData(null);
          }}
          sessionId={ratingSessionData.sessionId}
          receiverId={ratingSessionData.receiverId}
          receiverName={ratingSessionData.receiverName}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
};

export default SessionBooking;
