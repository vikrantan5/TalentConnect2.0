import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/apiService';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  RefreshCw,
  Activity,
  BadgeIndianRupee,
  Sparkles,
  IndianRupee,
  Inbox,
  CheckCircle2,
  Clock3,
  CircleDashed,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ---------- helpers ----------
const formatINR = (value) => {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const STATUS_META = {
  open: { label: 'Open', dot: 'bg-cyan-500', chip: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 ring-cyan-500/20', Icon: CircleDashed },
  assigned: { label: 'Assigned', dot: 'bg-amber-500', chip: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-amber-500/25', Icon: Clock3 },
  in_progress: { label: 'In Progress', dot: 'bg-indigo-500', chip: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-indigo-500/25', Icon: Loader2 },
  submitted: { label: 'Submitted', dot: 'bg-violet-500', chip: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 ring-violet-500/25', Icon: Sparkles },
  completed: { label: 'Completed', dot: 'bg-emerald-500', chip: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', dot: 'bg-rose-500', chip: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-rose-500/25', Icon: XCircle },
  pending_payment: { label: 'Pending Payment', dot: 'bg-zinc-400', chip: 'bg-zinc-500/12 text-zinc-700 dark:text-zinc-300 ring-zinc-500/25', Icon: Clock3 },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.open;


// API responses sometimes wrap as { task, acceptor } / { task, creator }.
// Normalise to a flat task object that always carries `acceptor` / `creator`.
const normaliseTaskRow = (row) => {
  if (!row) return null;
  if (row.task) {
    return {
      ...row.task,
      acceptor: row.acceptor || row.task.acceptor,
      creator: row.creator || row.task.creator,
    };
  }
  return row;
};


// Build wallet ledger from raw task arrays (myTasks => debits, acceptedTasks => credits)
const buildLedger = ({ myTasks = [], acceptedTasks = [] }) => {
   const myFlat = (myTasks || []).map(normaliseTaskRow).filter(Boolean);
  const acceptedFlat = (acceptedTasks || []).map(normaliseTaskRow).filter(Boolean);

  const debits = myFlat
    .filter((t) => !['pending_payment', 'cancelled'].includes(t.status))
    .filter((t) => ['open', 'assigned', 'submitted', 'in_progress', 'completed'].includes(t.status))
    .map((t) => {
      const counterparty =
        t.acceptor?.full_name ||
        t.acceptor?.username ||
        t.assigned_to_name ||
        'Awaiting worker';
      return {
        id: `debit-${t.id}`,
        type: 'debit',
        amount: Number(t.price || 0),
        title: t.title || 'Untitled task',
        description: 'You posted this task — escrow payment held.',
        counterparty,
        status: t.status,
        createdAt: t.created_at || t.updated_at,
      };
    });

 const credits = acceptedFlat
    .filter((t) => t.status === 'completed')
    .map((t) => ({
      id: `credit-${t.id}`,
      type: 'credit',
      amount: Number(t.price || 0),
      title: t.title || 'Untitled task',
      description: 'You completed this task — payment released to you.',
      counterparty: t.creator?.full_name || t.creator?.username || 'Anonymous',
      status: t.status,
      createdAt: t.updated_at || t.created_at,
    }));

  const all = [...credits, ...debits].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const totalSpent = debits.reduce((s, t) => s + t.amount, 0);
  const totalEarned = credits.reduce((s, t) => s + t.amount, 0);
  const balance = totalEarned - totalSpent;

  return { transactions: all, totalSpent, totalEarned, balance };
};

// ---------- skeleton ----------
const Shimmer = ({ className = '' }) => (
  <div
    className={`relative overflow-hidden bg-black/5 dark:bg-white/5 ${className}`}
    style={{
      backgroundImage:
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
      backgroundSize: '1000px 100%',
      animation: 'shimmer 2.2s linear infinite',
    }}
  />
);

const StatSkeleton = () => (
  <div className="bento p-6">
    <Shimmer className="w-12 h-12 rounded-2xl" />
    <Shimmer className="mt-5 h-3 w-24 rounded-full" />
    <Shimmer className="mt-3 h-9 w-40 rounded-lg" />
    <Shimmer className="mt-2 h-3 w-32 rounded-full" />
  </div>
);

const RowSkeleton = () => (
  <div className="px-6 md:px-8 py-5 flex items-center gap-4">
    <Shimmer className="w-12 h-12 rounded-2xl shrink-0" />
    <div className="flex-1">
      <Shimmer className="h-4 w-1/3 rounded-md" />
      <Shimmer className="mt-2 h-3 w-1/2 rounded-md" />
    </div>
    <div className="hidden sm:block">
      <Shimmer className="h-6 w-24 rounded-full" />
    </div>
    <div className="text-right">
      <Shimmer className="h-7 w-24 rounded-md ml-auto" />
      <Shimmer className="mt-2 h-3 w-16 rounded-md ml-auto" />
    </div>
  </div>
);

// ---------- main ----------
const Wallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [ledger, setLedger] = useState({
    transactions: [],
    totalSpent: 0,
    totalEarned: 0,
    balance: 0,
  });
  const [filter, setFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [myTasks, acceptedTasks] = await Promise.all([
        taskService.getMyTasks().catch(() => []),
        taskService.getAcceptedTasks().catch(() => []),
      ]);
      const built = buildLedger({
        myTasks: Array.isArray(myTasks) ? myTasks : [],
        acceptedTasks: Array.isArray(acceptedTasks) ? acceptedTasks : [],
      });
      setLedger(built);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Wallet fetch error', e);
      setError('Could not load wallet. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    let list = ledger.transactions;
    if (filter !== 'all') list = list.filter((t) => t.type === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.counterparty || '').toLowerCase().includes(q) ||
          (t.status || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [ledger.transactions, filter, search]);

  const stats = [
    {
      key: 'balance',
      label: 'Wallet Balance',
      value: formatINR(ledger.balance),
      icon: WalletIcon,
      tone: 'from-emerald-400 to-emerald-600',
      hint: ledger.balance >= 0 ? 'Net positive' : 'Net negative',
      hintTone: ledger.balance >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300',
    },
    {
      key: 'earned',
      label: 'Total Earned',
      value: formatINR(ledger.totalEarned),
      icon: ArrowDownLeft,
      tone: 'from-cyan-400 to-cyan-600',
      hint: `${ledger.transactions.filter((t) => t.type === 'credit').length} credits`,
      hintTone: 'text-cyan-700 dark:text-cyan-300',
      trend: 'up',
    },
    {
      key: 'spent',
      label: 'Total Spent',
      value: formatINR(ledger.totalSpent),
      icon: ArrowUpRight,
      tone: 'from-coral-400 to-coral-600',
      hint: `${ledger.transactions.filter((t) => t.type === 'debit').length} debits`,
      hintTone: 'text-coral-600 dark:text-coral-300',
      trend: 'down',
    },
    {
      key: 'count',
      label: 'Total Transactions',
      value: String(ledger.transactions.length),
      icon: Activity,
      tone: 'from-indigo-400 to-indigo-600',
      hint: 'Across all marketplace tasks',
      hintTone: 'text-indigo-700 dark:text-indigo-300',
    },
  ];

  const ease = [0.22, 1, 0.36, 1];

  return (
    <div
      className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white"
      data-testid="wallet-page"
    >
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div
        className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none"
        style={{ animationDelay: '-8s' }}
      />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ======================== HERO BALANCE ======================== */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="relative mb-8"
        >
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white shadow-soft-lg">
            {/* subtle radial accents */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-70 pointer-events-none"
              style={{
                background:
                  'radial-gradient(700px 420px at 8% -10%, rgba(34,211,238,.32), transparent 60%), radial-gradient(620px 480px at 100% 110%, rgba(255,106,91,.22), transparent 60%), radial-gradient(640px 540px at 50% 130%, rgba(99,102,241,.22), transparent 60%)',
              }}
            />
            {/* faint grid */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
              }}
            />

            <div className="relative p-7 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* LEFT: balance */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-white/8 ring-1 ring-white/15 text-cyan-200"
                    data-testid="live-ledger-badge"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    live ledger
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
                    Updated {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : '—'}
                  </span>
                </div>

                <p className="mt-4 text-ink-300 text-sm">Current wallet balance</p>
                <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                  <motion.h1
                    key={ledger.balance}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="font-display tracking-tight leading-[0.9] text-[56px] md:text-[84px]"
                    data-testid="wallet-balance"
                  >
                    {loading ? (
                      <Shimmer className="h-[64px] md:h-[84px] w-[280px] rounded-2xl" />
                    ) : (
                      <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                        {formatINR(ledger.balance)}
                      </span>
                    )}
                  </motion.h1>
                </div>

                <div className="mt-5 flex items-center gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30 text-emerald-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Earned {formatINR(ledger.totalEarned)}
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-coral-500/15 ring-1 ring-coral-400/30 text-coral-200">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Spent {formatINR(ledger.totalSpent)}
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/15 text-ink-200">
                    <Activity className="w-3.5 h-3.5" />
                    {ledger.transactions.length} transactions
                  </div>
                </div>
              </div>

              {/* RIGHT: refresh + summary card */}
              <div className="lg:col-span-5 lg:justify-self-end w-full">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => fetchData({ silent: true })}
                    className="inline-flex items-center gap-2 text-sm text-white/90 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/15 transition"
                    data-testid="wallet-refresh-button"
                    disabled={refreshing || loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>

                <div className="mt-5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 backdrop-blur-md p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">Snapshot</p>
                    <BadgeIndianRupee className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-ink-300">Earned</p>
                      <p className="font-display text-2xl mt-0.5 text-emerald-300">
                        {loading ? <Shimmer className="h-7 w-20 rounded" /> : formatINR(ledger.totalEarned)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-ink-300">Spent</p>
                      <p className="font-display text-2xl mt-0.5 text-coral-300">
                        {loading ? <Shimmer className="h-7 w-20 rounded" /> : formatINR(ledger.totalSpent)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ======================== STATS GRID ======================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease }}
                    whileHover={{ y: -3 }}
                    className="bento p-6 group"
                    data-testid={`stat-card-${s.key}`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.tone} text-white grid place-items-center shadow-soft transition-transform group-hover:scale-105`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      {s.trend === 'up' && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                          <TrendingUp className="w-3 h-3" /> in
                        </span>
                      )}
                      {s.trend === 'down' && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-coral-600 dark:text-coral-300 px-2 py-0.5 rounded-full bg-coral-500/10 ring-1 ring-coral-500/20">
                          <TrendingDown className="w-3 h-3" /> out
                        </span>
                      )}
                    </div>
                    <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">
                      {s.label}
                    </p>
                    <p className="font-display text-[34px] md:text-[40px] mt-1 leading-none break-all">
                      {s.value}
                    </p>
                    <p className={`mt-2 text-xs ${s.hintTone}`}>{s.hint}</p>
                  </motion.div>
                );
              })}
        </div>

        {/* ======================== FILTERS / SEARCH ======================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.05 }}
          className="bento p-4 md:p-5 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search by task, person or status…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition placeholder:text-ink-400"
                  data-testid="wallet-search-input"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'all', label: 'All', icon: Activity, tone: 'from-ink-700 to-ink-900' },
                { id: 'credit', label: 'Earned', icon: ArrowDownLeft, tone: 'from-emerald-500 to-cyan-500' },
                { id: 'debit', label: 'Spent', icon: ArrowUpRight, tone: 'from-coral-500 to-coral-600' },
              ].map((f) => {
                const Icon = f.icon;
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    data-testid={`wallet-filter-${f.id}`}
                    className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition ${
                      active
                        ? `bg-gradient-to-r ${f.tone} text-white shadow-soft`
                        : 'bg-white/70 dark:bg-white/5 text-ink-700 dark:text-ink-200 ring-1 ring-black/5 dark:ring-white/10 hover:bg-white dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {f.label}
                    {active && filter !== 'all' && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/25">
                        {filter === 'credit'
                          ? ledger.transactions.filter((t) => t.type === 'credit').length
                          : ledger.transactions.filter((t) => t.type === 'debit').length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ======================== LEDGER ======================== */}
        <div className="bento p-0 overflow-hidden">
          <div className="px-6 md:px-8 py-6 border-b border-black/5 dark:border-white/10 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                <Sparkles className="w-3 h-3" /> transactions
              </span>
              <h2 className="font-display text-3xl md:text-[40px] mt-2 leading-tight">
                Transaction <span className="italic text-cyan-600 dark:text-cyan-300">history</span>
              </h2>
              <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
                Derived live from marketplace tasks. No virtual tokens — just real INR.
              </p>
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-300">
              Showing <span className="font-semibold text-ink-900 dark:text-white">{filtered.length}</span> of{' '}
              <span className="font-semibold text-ink-900 dark:text-white">{ledger.transactions.length}</span>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="px-6 md:px-8 py-16 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-rose-500/10 ring-1 ring-rose-500/20 text-rose-500">
                <XCircle className="w-7 h-7" />
              </div>
              <p className="mt-4 font-display text-2xl">Could not load wallet</p>
              <p className="text-sm text-ink-500 mt-1">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink-950 text-white text-sm hover:bg-ink-800 transition"
                data-testid="wallet-retry-button"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              hasAny={ledger.transactions.length > 0}
              onClear={() => {
                setSearch('');
                setFilter('all');
              }}
            />
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              <AnimatePresence initial={false}>
                {filtered.map((tx, idx) => (
                  <TransactionRow key={tx.id} tx={tx} index={idx} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- transaction row ----------
const TransactionRow = ({ tx, index }) => {
  const isCredit = tx.type === 'credit';
  const status = getStatusMeta(tx.status);
  const StatusIcon = status.Icon;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.02, 0.18), ease: [0.22, 1, 0.36, 1] }}
      className="px-5 md:px-8 py-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
      data-testid="wallet-transaction-row"
    >
      <div className="flex items-center gap-4">
        {/* icon */}
        <div
          className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl grid place-items-center shrink-0 shadow-soft text-white bg-gradient-to-br ${
            isCredit ? 'from-emerald-400 to-cyan-500' : 'from-coral-400 to-coral-600'
          }`}
          aria-hidden
        >
          {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>

        {/* main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink-950 dark:text-white truncate" title={tx.title}>
              {tx.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ring-1 ${status.chip}`}
              data-testid="wallet-transaction-status"
            >
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-300 mt-1 line-clamp-1">
            {tx.description}
          </p>
          <p className="text-[11px] text-ink-400 dark:text-ink-400 mt-1">
            <span className="text-ink-500 dark:text-ink-300">
              {isCredit ? 'From' : 'To'}:
            </span>{' '}
            <span className="font-medium text-ink-700 dark:text-ink-100">{tx.counterparty}</span>
          </p>
        </div>

        {/* amount */}
        <div className="text-right shrink-0">
          <p
            className={`font-display text-2xl md:text-[28px] leading-none ${
              isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-coral-600 dark:text-coral-400'
            }`}
            data-testid="wallet-transaction-amount"
          >
            {isCredit ? '+' : '−'}
            {formatINR(tx.amount).replace('₹', '₹')}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500 mt-1">
            INR · {formatDate(tx.createdAt)}
          </p>
        </div>
      </div>
    </motion.li>
  );
};

// ---------- empty state ----------
const EmptyState = ({ hasAny, onClear }) => {
  return (
    <div className="px-6 md:px-8 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-400/30 to-indigo-500/30 blur-xl" />
          <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-ink-900 ring-1 ring-black/5 dark:ring-white/10 grid place-items-center shadow-soft">
            <Inbox className="w-9 h-9 text-cyan-500" />
          </div>
        </div>
        <h3 className="font-display text-2xl md:text-3xl mt-5">
          {hasAny ? 'No matches for that filter' : 'No wallet activity yet'}
        </h3>
        <p className="text-sm text-ink-500 dark:text-ink-300 mt-2">
          {hasAny
            ? 'Try a different search term or switch the filter to see more.'
            : 'Post a task or accept one from the marketplace to start tracking your real INR transactions here.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          {hasAny ? (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink-950 text-white text-sm hover:bg-ink-800 transition"
              data-testid="wallet-clear-filters"
            >
              Clear filters
            </button>
          ) : (
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm shadow-soft hover:shadow-glow transition"
              data-testid="wallet-explore-marketplace"
            >
              Explore Marketplace
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
