import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UserProfileModal from '../components/UserProfileModal';
import axios from 'axios';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Users,
  Award,
  Target,
  Sparkles,
  CheckCircle,
  RefreshCw,
  User,
  ArrowRight,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Leaderboard = () => {
  const [activeCategory, setActiveCategory] = useState('top_mentor');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeCategory]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard/`, {
        params: { category: activeCategory, limit: 20 }
      });
      const transformedData = response.data.leaderboard?.map(item => ({
        rank: item.rank,
        user_id: item.user_id || item.user?.id,
        username: item.user?.username || item.username,
        full_name: item.user?.full_name || item.full_name,
        profile_photo: item.user?.profile_photo || item.profile_photo,
        score: item.score,
        trust_score: item.user?.trust_score || 0,
        stats: {
          total_sessions: item.user?.total_sessions || 0,
          average_rating: item.user?.average_rating || 0
        }
      })) || [];

      setLeaderboard(transformedData);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
      setLeaderboard([]);
    }
    setLoading(false);
  };

  const categories = [
    { id: 'top_mentor', label: 'Top Mentors', icon: Crown, iconBg: 'from-amber-400 to-coral-400', description: 'Most active and highest-rated mentors' },
    { id: 'top_learner', label: 'Top Learners', icon: Target, iconBg: 'from-cyan-400 to-indigo-500', description: 'Most dedicated learners' },
    { id: 'top_contributor', label: 'Top Contributors', icon: Sparkles, iconBg: 'from-coral-400 to-pink-500', description: 'Overall platform engagement leaders' },
  ];

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-amber-300', accent: 'from-amber-300 to-coral-400' };
    if (rank === 2) return { icon: Medal, color: 'text-ink-300', accent: 'from-ink-200 to-ink-400' };
    if (rank === 3) return { icon: Medal, color: 'text-coral-300', accent: 'from-coral-300 to-coral-500' };
    return { icon: Award, color: 'text-cyan-300', accent: 'from-cyan-400 to-indigo-500' };
  };

  const getTrustBadge = (score) => {
    if (score >= 90) return { label: 'Gold Mentor', icon: '🏆', tone: 'coral' };
    if (score >= 75) return { label: 'Silver Mentor', icon: '🥈', tone: 'ink' };
    if (score >= 60) return { label: 'Bronze Mentor', icon: '🥉', tone: 'coral' };
    return { label: 'Aspiring Mentor', icon: '⭐', tone: 'cyan' };
  };

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="leaderboard-page">
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header — ink-navy hero */}
        <div className="relative mb-10 animate-scale-in">
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-8 md:p-12 shadow-soft-lg text-center">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(600px 400px at 10% -10%, rgba(34,211,238,.28), transparent 60%), radial-gradient(600px 500px at 95% 110%, rgba(255,106,91,.22), transparent 60%)',
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center justify-center mb-5">
                <div className="w-16 h-16 rounded-3xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-amber-300 backdrop-blur-md">
                  <Trophy className="w-8 h-8" />
                </div>
              </div>
              <span className="chip chip-cyan mb-4"><Sparkles className="w-3 h-3" /> top performers</span>
              <h1 className="font-display text-5xl md:text-7xl leading-[.95] tracking-tight">
                The <span className="italic text-gradient-cyan">leaderboard</span>.
              </h1>
              <p className="mt-4 text-ink-300 max-w-xl mx-auto text-lg">
                Celebrating the people who ship, teach and lift the community every day.
              </p>
            </div>
          </div>
        </div>

        {/* Category Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`bento bento-glow p-6 text-left transition-all ${isActive ? 'ring-2 ring-cyan-400/50' : ''}`}
                data-testid={`category-${category.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.iconBg} grid place-items-center text-white shadow-soft`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {isActive && <CheckCircle className="w-5 h-5 text-cyan-500" />}
                </div>
                <h3 className="font-display text-2xl mt-1 leading-tight">{category.label}</h3>
                <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{category.description}</p>
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <div className="flex justify-end mb-6">
          <button onClick={loadLeaderboard} disabled={loading} className="btn btn-ghost disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-5">
              <div className="tc-spinner" />
              <p className="font-display text-xl text-ink-600 dark:text-ink-200">Loading rankings…</p>
            </div>
          </div>
        ) : error ? (
          <div className="bento p-10 text-center">
            <p className="text-coral-500 mb-4">{error}</p>
            <button onClick={loadLeaderboard} className="btn btn-coral">Try again</button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <Trophy className="w-12 h-12 text-ink-400" />
            <p className="font-display text-2xl">No data available</p>
            <p className="text-sm text-ink-500 max-w-sm">
              Leaderboard data will appear as users engage with the platform.
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 max-w-5xl mx-auto">
              {[1, 0, 2].map((index) => {
                const entry = leaderboard[index];
                if (!entry) return null;
                const rankBadge = getRankBadge(entry.rank);
                const RankIcon = rankBadge.icon;
                const trustBadge = entry.trust_score ? getTrustBadge(entry.trust_score) : null;
                const isWinner = index === 0;

                return (
                  <div
                    key={entry.rank}
                    className={`${index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'} ${isWinner ? 'md:scale-105' : ''}`}
                  >
                    <div className={`bento bento-glow p-7 ${isWinner ? 'bg-ink-950 text-white' : ''} relative overflow-hidden`}>
                      {isWinner && (
                        <div
                          className="absolute inset-0 opacity-60"
                          style={{
                            background:
                              'radial-gradient(500px 300px at 100% -10%, rgba(255,193,7,.3), transparent 60%), radial-gradient(400px 300px at -10% 110%, rgba(255,106,91,.22), transparent 60%)',
                          }}
                        />
                      )}
                      <div className="relative">
                        <div className="flex justify-center mb-5">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rankBadge.accent} grid place-items-center shadow-soft`}>
                            <RankIcon className="w-7 h-7 text-white" />
                          </div>
                        </div>

                        <div className="flex justify-center mb-4">
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-indigo-500 p-1 shadow-soft">
                            <div className={`w-full h-full rounded-3xl ${isWinner ? 'bg-white/10' : 'bg-white dark:bg-ink-900'} grid place-items-center backdrop-blur`}>
                              <span className="font-display text-3xl text-cyan-500 dark:text-cyan-300">
                                {entry.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <h3 className={`text-center font-display text-2xl ${isWinner ? 'text-white' : ''}`}>
                          {entry.full_name || entry.username}
                        </h3>
                        <p className={`text-center text-xs uppercase tracking-widest mt-1 ${isWinner ? 'text-ink-300' : 'text-ink-500'}`}>
                          @{entry.username}
                        </p>

                        {trustBadge && (
                          <div className="flex justify-center mt-4">
                            <span className={`chip ${trustBadge.tone === 'coral' ? 'chip-coral' : trustBadge.tone === 'ink' ? 'chip-ink' : 'chip-cyan'} ${isWinner ? 'ring-1 ring-white/15 bg-white/5 text-white' : ''}`}>
                              <span>{trustBadge.icon}</span> {trustBadge.label}
                            </span>
                          </div>
                        )}

                        <div className="mt-5 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={isWinner ? 'text-ink-300' : 'text-ink-500'}>Score</span>
                            <span className="font-display text-2xl text-gradient">{entry.score || 0}</span>
                          </div>
                          {entry.stats && (
                            <>
                              <div className="flex items-center justify-between text-sm">
                                <span className={isWinner ? 'text-ink-300' : 'text-ink-500'}>Sessions</span>
                                <span className="font-semibold">{entry.stats.total_sessions || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className={isWinner ? 'text-ink-300' : 'text-ink-500'}>Rating</span>
                                <span className="font-semibold flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                  {entry.stats.average_rating?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedUserId(entry.user_id || entry.id);
                            setShowProfileModal(true);
                          }}
                          className={`mt-5 w-full ${isWinner ? 'btn btn-cyan' : 'btn btn-ghost'}`}
                          data-testid="leaderboard-view-profile-button"
                        >
                          <User className="w-4 h-4" />
                          View profile
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest of Leaderboard */}
            <div className="bento p-0 overflow-hidden">
              <div className="px-6 md:px-8 py-6 border-b border-black/5 dark:border-white/10">
                <span className="chip chip-cyan mb-2"><Users className="w-3 h-3" /> rankings</span>
                <h2 className="font-display text-3xl md:text-4xl leading-tight">
                  Full <span className="italic text-gradient-cyan">rankings</span>
                </h2>
              </div>

              <div className="divide-y divide-black/5 dark:divide-white/5">
                {leaderboard.slice(3).map((entry) => {
                  const trustBadge = entry.trust_score ? getTrustBadge(entry.trust_score) : null;

                  return (
                    <div
                      key={entry.rank}
                      className="px-6 md:px-8 py-5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                      data-testid="leaderboard-entry"
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-12 text-center">
                          <span className="font-display text-3xl text-ink-400">#{entry.rank}</span>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 p-0.5 shadow-soft">
                          <div className="w-full h-full rounded-2xl bg-white dark:bg-ink-900 grid place-items-center">
                            <span className="font-display text-xl text-cyan-500 dark:text-cyan-300">
                              {entry.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink-950 dark:text-white truncate">{entry.full_name || entry.username}</h3>
                          <p className="text-xs text-ink-500 dark:text-ink-300">@{entry.username}</p>
                        </div>

                        {trustBadge && (
                          <span className={`chip ${trustBadge.tone === 'coral' ? 'chip-coral' : trustBadge.tone === 'ink' ? 'chip-ink' : 'chip-cyan'} hidden md:inline-flex`}>
                            <span>{trustBadge.icon}</span> {trustBadge.label}
                          </span>
                        )}

                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-ink-500">Score</p>
                            <p className="font-display text-2xl text-gradient">{entry.score || 0}</p>
                          </div>
                          {entry.stats && (
                            <>
                              <div className="text-center">
                                <p className="text-[10px] uppercase tracking-widest text-ink-500">Sessions</p>
                                <p className="font-semibold">{entry.stats.total_sessions || 0}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] uppercase tracking-widest text-ink-500">Rating</p>
                                <p className="font-semibold flex items-center gap-1 justify-center">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                  {entry.stats.average_rating?.toFixed(1) || '0.0'}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedUserId(entry.user_id || entry.id);
                            setShowProfileModal(true);
                          }}
                          className="btn btn-ghost"
                          data-testid="leaderboard-list-view-profile-button"
                        >
                          <User className="w-4 h-4" />
                          Profile <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

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

export default Leaderboard;
