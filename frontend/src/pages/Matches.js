import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UserProfileModal from '../components/UserProfileModal';
import PerfectMatchCard from '../components/PerfectMatchCard';
import MentorMatchCard from '../components/MentorMatchCard';
import LearnerMatchCard from '../components/LearnerMatchCard';
import StartExchangeModal from '../components/StartExchangeModal';
import MentorBookingModal from '../components/MentorBookingModal';
import { useAuth } from '../context/AuthContext';
import { Flame, GraduationCap, BookOpen, Sparkles, RefreshCw, Users, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Matches = () => {
  const { user, darkMode } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [perfectMatches, setPerfectMatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [learners, setLearners] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [perfectRes, mentorsRes, learnersRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/match/perfect`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/match/mentors`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/match/learners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPerfectMatches(perfectRes.data.perfect_matches || []);
      setMentors(mentorsRes.data.mentors || []);
      setLearners(learnersRes.data.learners || []);
      setAiSuggestions(mentorsRes.data.ai_suggestions || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleChat = async (match) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/chat/create`,
        { receiver_id: match.user_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatId = response.data.chat?.id;
      if (chatId) {
        navigate(`/messages?chat=${chatId}`);
      } else {
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat. Please try again.');
    }
  };

  const handleStartExchange = (match) => {
    setSelectedMatch(match);
    setShowExchangeModal(true);
  };

  const handleBookMentor = (mentor) => {
    setSelectedMatch(mentor);
    setShowMentorModal(true);
  };

  const handleViewProfile = (match) => {
    setSelectedUserId(match.user_id);
    setShowProfileModal(true);
  };

  const handleBookingSuccess = () => {
    alert('Session request sent successfully!');
    loadMatches();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white">
          <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
          <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
          <Navbar />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="flex flex-col items-center gap-5">
              <div className="tc-spinner" />
              <p className="font-display text-xl text-ink-600 dark:text-ink-200">Finding your perfect matches…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white">
        <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
        <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
        <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

        <div className="relative z-10">
          <Navbar />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header — ink-navy hero */}
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
                  <span className="chip chip-cyan mb-3"><Sparkles className="w-3 h-3" /> AI matching</span>
                  <h1 className="font-display text-5xl md:text-6xl leading-[.95] tracking-tight">
                    Your <span className="italic text-gradient">matches</span>,<br />
                    <span className="italic text-gradient-cyan">curated</span>.
                  </h1>
                  <p className="mt-3 text-ink-300">AI-powered skill matching to help you grow.</p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-10">
            {[
              { icon: Flame, label: 'Perfect Matches', value: perfectMatches.length, iconBg: 'from-coral-400 to-pink-500' },
              { icon: GraduationCap, label: 'Available Mentors', value: mentors.length, iconBg: 'from-cyan-400 to-indigo-500' },
              { icon: BookOpen, label: 'Eager Learners', value: learners.length, iconBg: 'from-emerald-400 to-cyan-500' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bento bento-glow p-6 animate-scale-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.iconBg} text-white grid place-items-center shadow-soft`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="mt-5 text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">{stat.label}</p>
                  <p className="font-display text-5xl mt-1 leading-none">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {perfectMatches.length > 0 && (
            <div className="mb-12" data-testid="perfect-matches-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral-400 to-pink-500 grid place-items-center text-white shadow-soft animate-pulse">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <span className="chip chip-coral mb-1.5">flagship</span>
                  <h2 className="font-display text-3xl md:text-4xl leading-tight">
                    Perfect skill <span className="italic text-gradient">exchange</span>
                  </h2>
                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">Mutual exchange opportunities — your best matches.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {perfectMatches.map((match) => (
                  <PerfectMatchCard
                    key={match.user_id}
                    match={match}
                    onChat={handleChat}
                    onStartExchange={handleStartExchange}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {mentors.length > 0 && (
            <div className="mb-12" data-testid="mentors-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white shadow-soft">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="chip chip-cyan mb-1.5">mentors</span>
                  <h2 className="font-display text-3xl md:text-4xl leading-tight">
                    Recommended <span className="italic text-gradient-cyan">mentors</span>
                  </h2>
                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">Experts who can teach what you want to learn.</p>
                </div>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="bento p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span className="chip chip-cyan">AI suggestions</span>
                    <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                      Also consider learning these skills
                    </p>
                  </div>
                  <div className="space-y-3">
                    {aiSuggestions.map((skill, idx) => (
                      <div key={idx} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4">
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-white text-xs font-bold">
                            {skill.skill_name || skill}
                          </span>
                          {skill.difficulty && (
                            <span className="chip chip-ink">
                              {skill.difficulty}
                            </span>
                          )}
                          {skill.learning_time_weeks && (
                            <span className="chip chip-ink">
                              ~{skill.learning_time_weeks} weeks
                            </span>
                          )}
                        </div>
                        {skill.reason && (
                          <p className="text-xs text-ink-500 dark:text-ink-300 mt-2">
                            {skill.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mentors.map((mentor) => (
                  <MentorMatchCard
                    key={mentor.user_id}
                    mentor={mentor}
                    onChat={handleChat}
                    onBookSession={handleBookMentor}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {learners.length > 0 && (
            <div className="mb-12" data-testid="learners-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-white shadow-soft">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="chip chip-cyan mb-1.5">learners</span>
                  <h2 className="font-display text-3xl md:text-4xl leading-tight">
                    Recommended <span className="italic text-gradient-cyan">learners</span>
                  </h2>
                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">People who want to learn what you can teach.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {learners.map((learner) => (
                  <LearnerMatchCard
                    key={learner.user_id}
                    learner={learner}
                    onChat={handleChat}
                    onConnect={handleBookMentor}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {perfectMatches.length === 0 && mentors.length === 0 && learners.length === 0 && (
            <div className="empty-state">
              <Users className="w-12 h-12 text-ink-400" />
              <p className="font-display text-3xl">No matches yet</p>
              <p className="text-sm text-ink-500 max-w-sm">
                Add skills you can teach and want to learn to get matched!
              </p>
              <button onClick={() => navigate('/skills')} className="btn btn-coral">
                Add your skills <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <StartExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        match={selectedMatch}
        onSuccess={handleBookingSuccess}
      />

      <MentorBookingModal
        isOpen={showMentorModal}
        onClose={() => setShowMentorModal(false)}
        mentor={selectedMatch}
        onSuccess={handleBookingSuccess}
      />

      {showProfileModal && selectedUserId && (
        <UserProfileModal
          isOpen={showProfileModal}
          userId={selectedUserId}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default Matches;
