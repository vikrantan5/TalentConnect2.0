import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminService } from '../services/apiService';
import {
  Users, CalendarCheck, Briefcase, IndianRupee, TrendingUp, TrendingDown,
  Shield, AlertTriangle, Search, RefreshCw, UserCheck, UserX,
  Clock, BarChart3, Mail, Star, Bell, CreditCard, Flag,
  CheckCircle, XCircle, Lock, Unlock, Ban, ArrowDownRight, Activity, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const StatusPill = ({ tone = 'cyan', children, icon: Icon }) => {
  const tones = {
    cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
    coral: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    red: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    ink: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${tones[tone] || tones.cyan}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

const SectionCard = ({ children, className = '' }) => (
  <div className={`bento p-0 overflow-hidden ${className}`}>{children}</div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, right }) => (
  <div className="flex items-center justify-between flex-wrap gap-3 p-6 border-b border-black/5 dark:border-white/10">
    <div className="flex items-center gap-3">
      {Icon && (
        <span className="w-10 h-10 rounded-2xl glass grid place-items-center text-cyan-600 dark:text-cyan-300">
          <Icon className="w-5 h-5" />
        </span>
      )}
      <div>
        <h2 className="font-display text-2xl leading-none">{title}</h2>
        {subtitle && <p className="text-sm text-ink-500 dark:text-ink-300 mt-1.5">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

const EmptyState = ({ icon: Icon, label }) => (
  <div className="empty-state m-6">
    {Icon && <Icon className="w-8 h-8 text-ink-400" />}
    <p className="font-display text-xl">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [escrowPayments, setEscrowPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('week');
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'overview') loadActivityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, activeTab]);

  const loadActivityData = async () => {
    try {
      const data = await adminService.getActivityData(timeRange);
      setActivityData(data.data || []);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsData, usersData] = await Promise.all([
        adminService.getAnalytics().catch(() => null),
        adminService.getAllUsers().catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setUsers(Array.isArray(usersData) ? usersData : []);

      switch (activeTab) {
        case 'transactions': {
          const r = await adminService.getAllTransactions().catch(() => []);
          setTransactions(Array.isArray(r) ? r : []);
          break;
        }
        case 'reports': {
          const r = await adminService.getAllReports().catch(() => []);
          setReports(Array.isArray(r) ? r : []);
          break;
        }
        case 'escrow': {
          const r = await adminService.getAllEscrowPayments().catch(() => []);
          setEscrowPayments(Array.isArray(r) ? r : []);
          break;
        }
        case 'refunds': {
          const r = await adminService.getAllRefunds().catch(() => []);
          setRefunds(Array.isArray(r) ? r : []);
          break;
        }
        case 'disputes': {
          const r = await adminService.getAllDisputes().catch(() => []);
          setDisputes(Array.isArray(r) ? r : []);
          break;
        }
        case 'banned': {
          const r = await adminService.getBannedUsers().catch(() => []);
          setBannedUsers(Array.isArray(r) ? r : []);
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setLoading(false);
  };

  const handleBanUser = async (userId, username) => {
    const reason = prompt(`Enter reason to ban ${username}:`);
    if (!reason) return;
    try {
      await adminService.banUser(userId, reason);
      loadAdminData();
    } catch (error) {
      alert('Failed to ban user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUnbanUser = async (userId, username) => {
    if (!window.confirm(`Unban ${username}?`)) return;
    try {
      await adminService.unbanUser(userId);
      loadAdminData();
    } catch (error) {
      alert('Failed to unban: ' + error.message);
    }
  };

  const handleForceRelease = async (paymentId) => {
    if (!window.confirm('Force release this payment?')) return;
    try {
      await adminService.forceReleasePayment(paymentId);
      loadAdminData();
    } catch (error) {
      alert('Failed to release: ' + error.message);
    }
  };

  const handleForceRefund = async (paymentId) => {
    const reason = prompt('Reason for force refund:');
    if (!reason) return;
    try {
      await adminService.forceRefundPayment(paymentId, reason);
      loadAdminData();
    } catch (error) {
      alert('Failed to refund: ' + error.message);
    }
  };

  const handleResolveReport = async (reportId, status) => {
    const notes = status === 'resolved' ? prompt('Resolution notes:') : prompt('Reason for dismissal:');
    if (!notes) return;
    try {
      await adminService.updateReport(reportId, status, notes);
      loadAdminData();
    } catch (error) {
      alert('Failed to update: ' + error.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'banned' && u.is_banned) ||
      (filterStatus === 'active' && !u.is_banned && u.is_active) ||
      (filterStatus === 'inactive' && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredReports = reports.filter((r) => (reportFilter === 'all' ? true : r.status === reportFilter));

  const stats = [
    { label: 'Total Users', value: analytics?.total_users || 0, icon: Users, change: '+12%', trend: 'up', accent: 'cyan' },
    { label: 'Total Sessions', value: analytics?.total_sessions || 0, icon: CalendarCheck, change: '+8%', trend: 'up', accent: 'emerald' },
    { label: 'Total Tasks', value: analytics?.total_tasks || 0, icon: Briefcase, change: '+15%', trend: 'up', accent: 'indigo' },
    { label: 'Revenue', value: `₹${(analytics?.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, change: '+23%', trend: 'up', accent: 'coral' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'escrow', label: 'Escrow', icon: Lock, badge: escrowPayments.filter((p) => p.escrow_status === null && p.is_escrowed === true).length },
    { id: 'refunds', label: 'Refunds', icon: ArrowDownRight },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'banned', label: 'Banned', icon: Ban },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
  ];

  const accentToBgRing = (accent) => ({
    cyan: 'from-cyan-400/30 to-cyan-500/0',
    emerald: 'from-emerald-400/30 to-emerald-500/0',
    indigo: 'from-indigo-400/30 to-indigo-500/0',
    coral: 'from-orange-400/30 to-orange-500/0',
  }[accent] || 'from-cyan-400/30 to-cyan-500/0');

  const accentTextIcon = (accent) => ({
    cyan: 'text-cyan-600 dark:text-cyan-300',
    emerald: 'text-emerald-600 dark:text-emerald-300',
    indigo: 'text-indigo-600 dark:text-indigo-300',
    coral: 'text-orange-600 dark:text-orange-300',
  }[accent] || 'text-cyan-600 dark:text-cyan-300');

  if (loading && activeTab !== 'overview') {
    return (
      <div className="min-h-screen aurora-bg" data-testid="admin-dashboard-page">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="tc-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg relative overflow-hidden" data-testid="admin-dashboard-page">
      {/* ambient blobs */}
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-orange-400/20 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/15 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <Navbar />

      <div className="relative max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4 animate-scale-in" data-animate>
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-ink-950 text-cyan-300 grid place-items-center ring-1 ring-white/10 shadow-soft">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <span className="chip chip-cyan"><Sparkles_DummyIcon /> admin · command center</span>
              <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight">
                Admin <span className="italic text-gradient-cyan">Dashboard</span>
              </h1>
              <p className="text-sm text-ink-500 dark:text-ink-300 mt-1.5">Real-time analytics and platform moderation</p>
            </div>
          </div>

          <button
            onClick={loadAdminData}
            data-testid="admin-refresh-button"
            className="btn btn-cyan px-5 py-2.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            const TrendIcon = s.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <div
                key={i}
                className="bento p-6 relative animate-scale-in"
                style={{ animationDelay: `${i * 70}ms` }}
                data-testid={`${s.label.toLowerCase().replace(' ', '-')}-stat`}
              >
                <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${accentToBgRing(s.accent)} blur-2xl pointer-events-none`} />
                <div className="flex items-start justify-between relative">
                  <span className={`w-11 h-11 rounded-2xl glass grid place-items-center ${accentTextIcon(s.accent)}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    <TrendIcon className="w-3.5 h-3.5" /> {s.change}
                  </span>
                </div>
                <p className="mt-5 text-[11px] uppercase tracking-[.18em] text-ink-500 dark:text-ink-300 font-semibold">{s.label}</p>
                <p className="font-display text-4xl mt-1 text-ink-950 dark:text-white">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="inline-flex items-center gap-1 glass rounded-full px-1.5 py-1.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  data-testid={`admin-tab-${t.id}`}
                  className={`relative px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-ink-950 text-white dark:bg-cyan-500 dark:text-ink-950 shadow-glow'
                      : 'text-ink-700 dark:text-ink-200 hover:text-ink-950 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {t.badge > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] grid place-items-center px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold">
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard className="lg:col-span-2">
              <SectionHeader
                icon={Activity}
                title="Platform Activity"
                subtitle="Daily trends across users, tasks and sessions"
                right={
                  <div className="flex gap-1 glass rounded-full p-1">
                    {['day', 'week', 'month'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`px-3 py-1.5 rounded-full text-xs capitalize font-semibold transition ${
                          timeRange === r
                            ? 'bg-ink-950 text-white dark:bg-cyan-500 dark:text-ink-950'
                            : 'text-ink-600 dark:text-ink-300 hover:text-ink-950 dark:hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                }
              />
              <div className="p-6">
                <div className="h-72">
                  {activityData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BarChart3 className="w-10 h-10 text-ink-400 mx-auto mb-3" />
                        <p className="text-sm text-ink-500 dark:text-ink-300">Loading analytics…</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="cu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="ct" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="cs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                        <XAxis dataKey="label" stroke="currentColor" opacity={0.6} style={{ fontSize: 12 }} />
                        <YAxis stroke="currentColor" opacity={0.6} style={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(255,255,255,.95)',
                            border: '1px solid rgba(15,23,48,.08)',
                            borderRadius: 14,
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 10 }} />
                        <Area type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2.5} fill="url(#cu)" name="New Users" />
                        <Area type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={2.5} fill="url(#ct)" name="Tasks" />
                        <Area type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2.5} fill="url(#cs)" name="Sessions" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader icon={Zap} title="Quick Actions" subtitle="Manage platform" />
              <div className="p-5 space-y-3">
                {[
                  { icon: Users, label: 'View All Users', action: () => setActiveTab('users'), badge: null },
                  { icon: Lock, label: 'Escrow Payments', action: () => setActiveTab('escrow'), badge: null },
                  { icon: Flag, label: 'Review Reports', action: () => setActiveTab('reports'), badge: reports.filter((r) => r.status === 'pending').length },
                  { icon: Ban, label: 'Banned Users', action: () => setActiveTab('banned'), badge: null },
                ].map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={i}
                      onClick={a.action}
                      data-testid={`admin-quick-${a.label.toLowerCase().replace(/s/g, '-')}`}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl glass hover:shadow-soft-lg hover:-translate-y-[1px] transition"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-ink-950 text-cyan-300 grid place-items-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="font-semibold text-sm">{a.label}</span>
                      </span>
                      {a.badge > 0 && (
                        <span className="px-2 py-0.5 bg-coral-500/15 text-coral-600 dark:text-orange-300 text-xs rounded-full font-bold border border-coral-500/30">
                          {a.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="mt-2 p-4 rounded-2xl glass">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-ink-500 dark:text-ink-300 font-semibold uppercase tracking-wider">Status</span>
                    <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Operational
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-ink-500 dark:text-ink-300">API</span><span className="font-semibold text-cyan-600 dark:text-cyan-300">32ms</span></div>
                    <div className="flex justify-between"><span className="text-ink-500 dark:text-ink-300">DB</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">Healthy</span></div>
                    <div className="flex justify-between"><span className="text-ink-500 dark:text-ink-300">Uptime</span><span className="font-semibold text-indigo-600 dark:text-indigo-300">99.9%</span></div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <SectionCard>
            <SectionHeader
              icon={Users}
              title="User Management"
              subtitle="Manage all platform users"
              right={
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="text"
                      placeholder="Search users…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="modern-input pl-9 py-2.5 w-56"
                      data-testid="admin-user-search"
                    />
                  </div>
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="modern-input py-2.5">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="mentor">Mentor</option>
                    <option value="student">Student</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="modern-input py-2.5">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              }
            />
            {filteredUsers.length === 0 ? (
              <EmptyState icon={Users} label="No users found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="tc-table" data-testid="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Contact</th>
                      <th>Role &amp; Status</th>
                      <th>Stats</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-ink-950 font-bold">
                              {u.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-ink-950 dark:text-white">{u.full_name || u.username}</div>
                              <div className="text-xs text-ink-500 dark:text-ink-300">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-200">
                            <Mail className="w-3.5 h-3.5 text-cyan-500" /> {u.email}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1.5">
                            <StatusPill tone="indigo" icon={Shield}>{u.role}</StatusPill>
                            {u.is_banned ? (
                              <StatusPill tone="red" icon={UserX}>Banned</StatusPill>
                            ) : u.is_active ? (
                              <StatusPill tone="emerald" icon={UserCheck}>Active</StatusPill>
                            ) : (
                              <StatusPill tone="ink" icon={Clock}>Inactive</StatusPill>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-center">
                              <div className="font-bold text-cyan-600 dark:text-cyan-300">{u.total_sessions || 0}</div>
                              <div className="text-ink-500 dark:text-ink-300">Sessions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-indigo-600 dark:text-indigo-300">{u.total_tasks || 0}</div>
                              <div className="text-ink-500 dark:text-ink-300">Tasks</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-amber-600 dark:text-amber-300 inline-flex items-center gap-1">
                                {u.average_rating?.toFixed(1) || '0.0'} <Star className="w-3 h-3 fill-current" />
                              </div>
                              <div className="text-ink-500 dark:text-ink-300">Rating</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {!u.is_banned ? (
                            <button
                              onClick={() => handleBanUser(u.id, u.username)}
                              className="btn btn-ghost text-red-600 dark:text-red-300 border-red-500/20 hover:bg-red-500/10 px-3 py-1.5 text-xs"
                              data-testid="ban-user-button"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Ban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnbanUser(u.id, u.username)}
                              className="btn btn-ghost text-emerald-600 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10 px-3 py-1.5 text-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Unban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* ESCROW */}
        {activeTab === 'escrow' && (
          <SectionCard>
            <SectionHeader icon={Lock} title="Escrow Payments" subtitle="Payments held in escrow awaiting action" />
            {escrowPayments.length === 0 ? (
              <EmptyState icon={Lock} label="No escrow payments found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="tc-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th><th>Amount</th><th>Payer</th><th>Payee</th><th>Task</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowPayments.map((p) => {
                      const displayStatus = p.escrow_status === null ? 'ESCROW_HELD' : p.escrow_status;
                      const isEscrowed = (p.escrow_status === null && p.is_escrowed === true) || displayStatus === 'ESCROW_HELD';
                      const ownerApproval = p.task_owner_approval || p.owner_approval_status || 'pending';
                      const canRelease = displayStatus === 'ESCROW_HELD' && ownerApproval === 'ACCEPTED';
                      const canRefund = displayStatus === 'ESCROW_HELD' && ownerApproval === 'REJECTED';
                      const payeeName = p.payee?.full_name || p.payee?.username || 'Not Assigned';
                      let actionMessage = 'Awaiting task submission';
                      if (ownerApproval === 'ACCEPTED') actionMessage = 'Owner approved – ready to release';
                      else if (ownerApproval === 'REJECTED') actionMessage = 'Owner rejected – ready to refund';
                      else if (displayStatus === 'RELEASED') actionMessage = 'Payment released';
                      else if (displayStatus === 'REFUNDED') actionMessage = 'Payment refunded';

                      const tone =
                        isEscrowed && (canRelease || canRefund) ? 'amber'
                          : isEscrowed ? 'amber'
                          : displayStatus === 'RELEASED' ? 'emerald'
                          : displayStatus === 'REFUNDED' ? 'red' : 'cyan';

                      return (
                        <tr key={p.id}>
                          <td><code className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-md">{p.id.slice(0, 8)}…</code></td>
                          <td><span className="font-semibold text-ink-950 dark:text-white">₹{p.amount}</span></td>
                          <td><span className="text-sm text-ink-600 dark:text-ink-200">{p.payer?.full_name || p.payer?.username || 'N/A'}</span></td>
                          <td><span className="text-sm text-ink-600 dark:text-ink-200">{payeeName}</span></td>
                          <td><span className="text-sm text-ink-500 dark:text-ink-300">{p.task?.title || 'N/A'}</span></td>
                          <td>
                            <StatusPill tone={tone} icon={isEscrowed && (canRelease || canRefund) ? Bell : undefined}>
                              {displayStatus}
                            </StatusPill>
                          </td>
                          <td>
                            <div className="space-y-1.5">
                              <div className="text-[11px] text-ink-500 dark:text-ink-300">{actionMessage}</div>
                              {displayStatus === 'ESCROW_HELD' ? (
                                <div className="flex items-center gap-2">
                                  {canRelease && (
                                    <button onClick={() => handleForceRelease(p.id)} data-testid="release-payment-button"
                                      className="btn btn-ghost text-emerald-600 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10 px-3 py-1.5 text-xs">
                                      <Unlock className="w-3.5 h-3.5" /> Release
                                    </button>
                                  )}
                                  {canRefund && (
                                    <button onClick={() => handleForceRefund(p.id)} data-testid="refund-payment-button"
                                      className="btn btn-ghost text-red-600 dark:text-red-300 border-red-500/20 hover:bg-red-500/10 px-3 py-1.5 text-xs">
                                      <ArrowDownRight className="w-3.5 h-3.5" /> Refund
                                    </button>
                                  )}
                                  {!canRelease && !canRefund && (
                                    <span className="text-[11px] italic text-ink-500 dark:text-ink-300">Awaiting owner action</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] italic text-ink-500 dark:text-ink-300">
                                  {displayStatus === 'RELEASED' ? '✓ Completed' : displayStatus === 'REFUNDED' ? '✓ Refunded' : 'No action'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* REFUNDS */}
        {activeTab === 'refunds' && (
          <SectionCard>
            <SectionHeader icon={ArrowDownRight} title="Refunds" subtitle="All refunded payments" />
            {refunds.length === 0 ? (
              <EmptyState icon={ArrowDownRight} label="No refunds found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="tc-table">
                  <thead>
                    <tr><th>Payment ID</th><th>Amount</th><th>Refunded To</th><th>Reason</th><th>Refunded At</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {refunds.map((r) => (
                      <tr key={r.id}>
                        <td><code className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-md">{r.id.slice(0, 8)}…</code></td>
                        <td><span className="font-semibold text-ink-950 dark:text-white">₹{r.amount}</span></td>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{r.payer?.username || 'N/A'}</span></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300 max-w-xs truncate inline-block">{r.refund_reason || 'N/A'}</span></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300">{r.refunded_at ? new Date(r.refunded_at).toLocaleDateString() : 'N/A'}</span></td>
                        <td><StatusPill tone="coral">{r.escrow_status || 'REFUNDED'}</StatusPill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
          <SectionCard>
            <SectionHeader
              icon={Flag}
              title="Reports"
              subtitle="Review and resolve user reports"
              right={
                <select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)} className="modern-input py-2.5">
                  <option value="all">All Reports</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              }
            />
            {filteredReports.length === 0 ? (
              <EmptyState icon={Flag} label="No reports found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="tc-table">
                  <thead>
                    <tr><th>Reporter</th><th>Type</th><th>Reason</th><th>Description</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => (
                      <tr key={r.id}>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{r.reporter?.username || 'N/A'}</span></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300">{r.report_type || 'general'}</span></td>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{r.reason}</span></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300 max-w-xs truncate inline-block">{r.description}</span></td>
                        <td>
                          <StatusPill tone={r.status === 'pending' ? 'amber' : r.status === 'resolved' ? 'emerald' : 'ink'}>{r.status}</StatusPill>
                        </td>
                        <td>
                          {r.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleResolveReport(r.id, 'resolved')}
                                className="btn btn-ghost text-emerald-600 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10 px-3 py-1.5 text-xs">
                                <CheckCircle className="w-3.5 h-3.5" /> Resolve
                              </button>
                              <button onClick={() => handleResolveReport(r.id, 'dismissed')}
                                className="btn btn-ghost text-ink-500 dark:text-ink-300 px-3 py-1.5 text-xs">
                                <XCircle className="w-3.5 h-3.5" /> Dismiss
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* DISPUTES */}
        {activeTab === 'disputes' && (
          <SectionCard>
            <SectionHeader icon={AlertTriangle} title="Disputes" subtitle="Resolve payment and task disputes" />
            {disputes.length === 0 ? (
              <EmptyState icon={AlertTriangle} label="No disputes found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="tc-table">
                  <thead>
                    <tr><th>Reporter</th><th>Reported</th><th>Type</th><th>Description</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {disputes.map((d) => (
                      <tr key={d.id}>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{d.reporter?.username || 'N/A'}</span></td>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{d.reported_user?.username || 'N/A'}</span></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300">{d.report_type}</span></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300 max-w-xs truncate inline-block">{d.description}</span></td>
                        <td>
                          <StatusPill tone={d.status === 'pending' ? 'red' : d.status === 'resolved' ? 'emerald' : 'ink'}>{d.status}</StatusPill>
                        </td>
                        <td>
                          {d.status === 'pending' && (
                            <button onClick={() => handleResolveReport(d.id, 'resolved')}
                              className="btn btn-ghost text-emerald-600 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10 px-3 py-1.5 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* BANNED */}
        {activeTab === 'banned' && (
          <SectionCard>
            <SectionHeader icon={Ban} title="Banned Users" subtitle="Manage banned accounts" />
            {bannedUsers.length === 0 ? (
              <EmptyState icon={Ban} label="No banned users" />
            ) : (
              <div className="overflow-x-auto">
                <table className="tc-table">
                  <thead>
                    <tr><th>User</th><th>Email</th><th>Reason</th><th>Reports</th><th>Banned At</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {bannedUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-400 to-coral-500 grid place-items-center text-white font-bold">
                              {u.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-ink-950 dark:text-white">{u.full_name || u.username}</div>
                              <div className="text-xs text-ink-500 dark:text-ink-300">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{u.email}</span></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300 max-w-xs truncate inline-block">{u.ban_reason || 'N/A'}</span></td>
                        <td><StatusPill tone="red">{u.report_count || 0} reports</StatusPill></td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300">{u.banned_at ? new Date(u.banned_at).toLocaleDateString() : 'N/A'}</span></td>
                        <td>
                          <button onClick={() => handleUnbanUser(u.id, u.username)}
                            className="btn btn-ghost text-emerald-600 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10 px-3 py-1.5 text-xs">
                            <UserCheck className="w-3.5 h-3.5" /> Unban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <SectionCard>
            <SectionHeader icon={CreditCard} title="Transactions" subtitle="All platform transactions" />
            {transactions.length === 0 ? (
              <EmptyState icon={CreditCard} label="No transactions found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="tc-table">
                  <thead>
                    <tr><th>Transaction ID</th><th>Amount</th><th>From</th><th>To</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td><code className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-md">{t.id.slice(0, 8)}…</code></td>
                        <td><span className="font-semibold text-ink-950 dark:text-white">₹{t.amount}</span></td>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{t.payer?.username || 'N/A'}</span></td>
                        <td><span className="text-sm text-ink-600 dark:text-ink-200">{t.payee?.username || 'N/A'}</span></td>
                        <td>
                          <StatusPill tone={t.status === 'completed' ? 'emerald' : t.status === 'pending' ? 'amber' : 'ink'}>{t.status}</StatusPill>
                        </td>
                        <td><span className="text-sm text-ink-500 dark:text-ink-300">{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
};

// Tiny inline icon used in the chip - avoids extra import name collisions
const Sparkles_DummyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" aria-hidden="true">
    <path d="M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
  </svg>
);

export default AdminDashboard;
