import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { skillService, taskService, sessionService, dashboardService, activitiesService } from '../services/apiService';
import axios from 'axios';
import CalendarWidget from '../components/CalendarWidget';
import {
  BookOpen, CheckCircle, Star, Target, PlusCircle, Briefcase, Bot, TrendingUp,
  Users, Award, Clock, Sparkles, ArrowRight, Calendar, Zap, Shield, Code,
  Palette, Globe, Camera, Music, PenTool, Moon, Sun, Bell, Settings, Activity,
  BarChart3, PieChart, Gift, Rocket, Crown, Medal, Trophy, Flame, Coffee,
  Compass, Heart, Share2, MoreHorizontal, Coins, Loader2, User
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTasks: 0,
    totalSkills: 0,
    averageRating: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [recommendedSkills, setRecommendedSkills] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeChart, setActiveChart] = useState('progress');
  const [tokenBalance, setTokenBalance] = useState(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    loadDashboardData();
    loadRecommendedSkills();
    loadRecentActivities();
    loadTokenBalance();
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await dashboardService.getStats();
      setStats({
        totalSessions: dashboardStats.total_sessions || 0,
        totalTasks: dashboardStats.tasks_completed || 0,
        totalSkills: dashboardStats.skills_listed || 0,
        averageRating: dashboardStats.average_rating || 0,
      });
      if (dashboardStats.tokens !== undefined) {
        setTokenBalance(dashboardStats.tokens);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadRecommendedSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${BACKEND_URL}/api/users/recommended-skills`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const skills = (response.data || []).map((s) => ({
          name: s.name || s.skill_name,
          icon: s.icon || Code,
          color: s.color || 'from-indigo-500 to-purple-400',
          students: s.students || 0,
        }));
        setRecommendedSkills(skills);
      }
    } catch (error) {
      console.error('Error loading recommended skills:', error);
      setRecommendedSkills([]);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const activities = await activitiesService.getRecent(20);
      const formattedActivities = (activities || []).map(activity => ({
        ...activity,
        timeAgo: getTimeAgo(activity.time)
      }));
      setRecentActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  const loadTokenBalance = async () => {
    setLoadingTokens(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${BACKEND_URL}/api/users/token-balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTokenBalance(response.data);
      }
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
    setLoadingTokens(false);
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
      { text: 'Learning is a treasure that will follow its owner everywhere.', author: 'Chinese Proverb' },
      { text: 'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.', author: 'Brian Herbert' },
      { text: 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.', author: 'Malcolm X' },
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const motivationalQuote = getMotivationalQuote();

  if (loading) {
    return (
      <div className={`${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen aurora-bg grid-bg relative overflow-hidden text-ink-950 dark:text-white">
          <div className="blob w-[480px] h-[480px] -left-40 top-10 bg-cyan-400/30" />
          <div className="blob w-[360px] h-[360px] right-[-6rem] top-[30%] bg-coral-400/30" style={{ animationDelay: '-4s' }} />
          <Navbar />
          <div className="flex items-center justify-center h-[70vh]">
            <div className="flex flex-col items-center gap-5">
              <div className="tc-spinner" />
              <p className="font-display text-xl text-ink-600 dark:text-ink-200">Loading your dashboard…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen aurora-bg grid-bg relative overflow-hidden text-ink-950 dark:text-white" data-testid="dashboard-page">
        {/* Floating blobs — matches LandingPage */}
        <div className="blob w-[520px] h-[520px] -left-40 top-10 bg-cyan-400/30" />
        <div className="blob w-[380px] h-[380px] right-[-6rem] top-[30%] bg-coral-400/30" style={{ animationDelay: '-4s' }} />
        <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20" style={{ animationDelay: '-8s' }} />

        <div className="relative z-10">
          <Navbar />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome banner — ink-navy card with aurora lighting */}
          <div className="relative mb-10 animate-scale-in" data-testid="welcome-section">
            <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-8 md:p-10 shadow-soft-lg">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    'radial-gradient(600px 400px at 10% -10%, rgba(34,211,238,.28), transparent 60%), radial-gradient(600px 500px at 95% 110%, rgba(255,106,91,.22), transparent 60%)',
                }}
              />
              <div className="relative flex items-center justify-between flex-wrap gap-8">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-5 mb-5">
                    <div className="w-16 h-16 rounded-3xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-3xl backdrop-blur-md">
                      {getGreetingEmoji()}
                    </div>
                    <div>
                      <span className="chip chip-cyan mb-3">
                        <Sparkles className="w-3 h-3" /> {greeting.toLowerCase()}
                      </span>
                      <h1 className="font-display text-4xl md:text-5xl leading-[1] tracking-tight">
                        Hey <span className="italic text-gradient-cyan">{user?.full_name || user?.username}</span>,
                        <br /> ready to <span className="italic text-gradient">grow</span>?
                      </h1>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 mt-6">
                    <span className="chip chip-ink ring-1 ring-white/10 bg-white/5 text-white">
                      <Calendar className="w-3.5 h-3.5" />
                      Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="chip chip-coral">
                      <Trophy className="w-3.5 h-3.5" />
                      {stats.averageRating > 0 ? `${stats.averageRating} ★ rating` : 'New member'}
                    </span>
                    <span className="chip chip-cyan" data-testid="token-balance-badge">
                      <Coins className="w-3.5 h-3.5" />
                      {loadingTokens ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Tokens · {tokenBalance?.balance || 0}</>}
                    </span>
                  </div>
                </div>

                {/* Motivational quote card */}
                <div className="hidden lg:block max-w-xs">
                  <div className="relative glass rounded-[24px] p-6 bg-white/5 border-white/10">
                    <Coffee className="w-7 h-7 text-cyan-300 mb-3" />
                    <p className="font-display text-xl leading-snug text-white/95 italic">“{motivationalQuote.text}”</p>
                    <p className="mt-3 text-xs uppercase tracking-widest text-ink-300">— {motivationalQuote.author}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid — bento cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-10">
            {[
              { icon: BookOpen, label: 'Total Sessions', value: stats.totalSessions, iconBg: 'from-cyan-400 to-cyan-600' },
              { icon: CheckCircle, label: 'Tasks Completed', value: stats.totalTasks, iconBg: 'from-emerald-400 to-emerald-600' },
              { icon: Star, label: 'Average Rating', value: stats.averageRating.toFixed(1), suffix: ' ★', iconBg: 'from-amber-400 to-coral-400' },
              { icon: Target, label: 'Skills Listed', value: stats.totalSkills, iconBg: 'from-indigo-400 to-indigo-600' },
              {
                icon: Coins,
                label: 'Skill Tokens',
                value: loadingTokens ? '...' : (tokenBalance?.balance || 0),
                iconBg: 'from-coral-400 to-coral-600',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bento bento-glow p-6 animate-scale-in"
                  style={{ animationDelay: `${index * 0.08}s` }}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/s+/g, '-')}`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.iconBg} text-white grid place-items-center shadow-soft`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="mt-5 text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">{stat.label}</p>
                  <p className="font-display text-5xl mt-1 leading-none">
                    {stat.value}{stat.suffix || ''}
                  </p>
                  <div className="mt-4 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stat.iconBg} rounded-full animate-progress`}
                      style={{ width: `${Math.min(100, (Number(stat.value) / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bento p-8 mb-10" data-testid="quick-actions">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <span className="chip chip-coral mb-3"><Zap className="w-3 h-3" /> hot today</span>
                <h2 className="font-display text-4xl md:text-5xl leading-tight">
                  Quick <span className="italic text-gradient">actions</span>
                </h2>
                <p className="mt-2 text-ink-500 dark:text-ink-300">Recommended for you today</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { to: '/skills', icon: PlusCircle, title: 'Add Skills', desc: 'List your expertise', gradient: 'from-cyan-400 to-indigo-500' },
                { to: '/tasks', icon: Briefcase, title: 'Browse Tasks', desc: 'Find earning opportunities', gradient: 'from-emerald-400 to-cyan-500' },
                { to: '/chatbot', icon: Bot, title: 'AI Assistant', desc: 'Get learning guidance', gradient: 'from-coral-400 to-pink-500' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.to}
                    className="group bento bento-glow p-7 block"
                    data-testid={`action-${action.title.toLowerCase().replace(/s+/g, '-')}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} grid place-items-center shadow-soft transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-3xl mt-5 leading-tight">{action.title}</h3>
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">{action.desc}</p>
                    <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-950 dark:text-white">
                      Explore <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Activity + Sidebar */}
          <div className="grid lg:grid-cols-3 gap-5 mb-10">
            {/* Recent Activity — left 2/3 */}
            <div className="lg:col-span-2 bento p-8" data-testid="recent-activity">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <span className="chip chip-cyan mb-3"><Activity className="w-3 h-3" /> live feed</span>
                  <h2 className="font-display text-3xl md:text-4xl leading-tight">
                    Recent <span className="italic text-gradient-cyan">activity</span>
                  </h2>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Your latest interactions</p>
                </div>
                <button className="btn btn-ghost text-xs">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentActivities.length === 0 ? (
                <div className="empty-state">
                  <Activity className="w-8 h-8 text-ink-400" />
                  <p className="font-display text-2xl">No activity yet</p>
                  <p className="text-sm text-ink-500 max-w-sm">
                    Start a session, post a skill, or browse tasks — your journey will show up here.
                  </p>
                  <Link to="/skills" className="btn btn-cyan mt-2">
                    Get started <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 6).map((activity, index) => {
                    const Icon = activity.icon || Activity;
                    const palette = activity.color === 'blue' ? 'from-cyan-400 to-cyan-600'
                      : activity.color === 'green' ? 'from-emerald-400 to-cyan-500'
                      : activity.color === 'purple' ? 'from-indigo-400 to-indigo-600'
                      : 'from-coral-400 to-coral-600';
                    return (
                      <div
                        key={index}
                        className="group flex items-center gap-4 p-4 rounded-2xl glass hover:shadow-soft transition-all animate-scale-in border border-transparent hover:border-black/5 dark:hover:border-white/10"
                        style={{ animationDelay: `${index * 0.06}s` }}
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${palette} grid place-items-center text-white shadow-soft transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink-950 dark:text-white truncate">{activity.title}</p>
                          <p className="text-xs text-ink-500 dark:text-ink-300 mt-0.5">{activity.timeAgo || activity.time}</p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10">
                          <MoreHorizontal className="w-4 h-4 text-ink-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              {/* Achievement card */}
              <div className="bento bento-glow p-7 bg-ink-950 text-white relative overflow-hidden" data-testid="achievement-card">
                <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(500px 300px at 100% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 300px at -10% 110%, rgba(255,106,91,.22), transparent 60%)' }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <Crown className="w-8 h-8 text-amber-300" />
                    <span className="chip chip-cyan">Level 5</span>
                  </div>
                  <h3 className="font-display text-3xl">Skill Seeker</h3>
                  <p className="text-sm text-ink-300 mt-1">Complete 10 more sessions to reach the next level.</p>

                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-semibold mb-2 text-ink-300">
                      <span>Progress to Level 6</span>
                      <span>65%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full animate-progress" style={{ width: '65%', background: 'linear-gradient(90deg,#22d3ee,#ff6a5b)' }} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <Medal className="w-5 h-5 text-amber-300" />
                    <span className="text-xs text-ink-200">3 achievements this month</span>
                  </div>
                </div>
              </div>

              {/* Recommended Skills */}
              {recommendedSkills.length > 0 && (
                <div className="bento p-7" data-testid="recommended-skills">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span className="chip chip-cyan">curated</span>
                  </div>
                  <h3 className="font-display text-2xl mt-3">Recommended skills</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-300">Handpicked for your goals</p>

                  <div className="mt-5 space-y-2.5">
                    {recommendedSkills.slice(0, 4).map((skill, i) => {
                      const Icon = skill.icon;
                      return (
                        <div
                          key={i}
                          className="group flex items-center gap-3 p-3 rounded-2xl glass hover:shadow-soft transition-all cursor-pointer"
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${skill.color} grid place-items-center text-white shadow-soft transition-transform duration-500 group-hover:scale-110`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{skill.name}</p>
                            <p className="text-[11px] text-ink-500 dark:text-ink-300">{skill.students} students</p>
                          </div>
                          <button className="w-8 h-8 rounded-full grid place-items-center hover:bg-cyan-500/10 transition">
                            <PlusCircle className="w-4 h-4 text-cyan-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <Link to="/skills" className="btn btn-ghost w-full mt-5">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Calendar Widget */}
              {user?.id && (
                <div className="bento p-0 overflow-hidden">
                  <CalendarWidget userId={user.id} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Promo Banner */}
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-8 md:p-10 shadow-soft-lg" data-testid="promo-banner">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(500px 300px at 10% -10%, rgba(255,106,91,.35), transparent 60%), radial-gradient(500px 400px at 95% 110%, rgba(34,211,238,.25), transparent 60%)',
              }}
            />
            <div className="relative flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center backdrop-blur-md">
                  <Gift className="w-7 h-7 text-coral-300" />
                </div>
                <div>
                  <span className="chip chip-coral mb-2">limited</span>
                  <h3 className="font-display text-3xl md:text-4xl leading-tight">
                    Special <span className="italic text-gradient">offer</span>
                  </h3>
                  <p className="text-sm text-ink-300 mt-1">Get 20% off on premium mentorship sessions this week.</p>
                </div>
              </div>
              <Link to="/sessions" className="btn btn-coral px-6 py-3">
                Claim offer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default Dashboard;
