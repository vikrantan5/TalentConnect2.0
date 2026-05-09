import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  ShoppingCart,
  BookOpen,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  IndianRupee,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Wallet = () => {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'earn', 'spend'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id) {
      loadWalletData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter, searchTerm]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const balanceResponse = await axios.get(`${BACKEND_URL}/api/users/token-balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokenBalance(balanceResponse.data);

      const transactionsResponse = await axios.get(`${BACKEND_URL}/api/users/token-transactions?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const getTransactionIcon = (type, reason) => {
    if (type === 'earn') {
      if (reason?.includes('session')) return BookOpen;
      if (reason?.includes('task')) return CheckCircle;
      if (reason?.includes('bonus')) return Award;
      return ArrowDownLeft;
    } else {
      if (reason?.includes('session')) return BookOpen;
      if (reason?.includes('purchase')) return ShoppingCart;
      return ArrowUpRight;
    }
  };

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatINR = (value) => {
    const n = Number(value || 0);
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const stats = [
    {
      label: 'Wallet Balance',
      value: formatINR(tokenBalance?.balance || 0),
      icon: IndianRupee,
      iconBg: 'from-cyan-400 to-cyan-600',
    },
    {
      label: 'Total Earned',
      value: formatINR(tokenBalance?.total_earned || 0),
      icon: TrendingUp,
      iconBg: 'from-emerald-400 to-cyan-500',
    },
    {
      label: 'Total Spent',
      value: formatINR(tokenBalance?.total_spent || 0),
      icon: TrendingDown,
      iconBg: 'from-coral-400 to-coral-600',
    },
    {
      label: 'Total Transactions',
      value: transactions.length,
      icon: Award,
      iconBg: 'from-indigo-400 to-indigo-600',
    }
  ];

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="wallet-page">
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
                <span className="chip chip-cyan mb-3"><IndianRupee className="w-3 h-3" /> wallet</span>
                <h1 className="font-display text-5xl md:text-6xl leading-[.95] tracking-tight">
                  Your <span className="italic text-gradient-cyan">money</span>,<br />
                  <span className="italic text-gradient">your story</span>.
                </h1>
                <p className="mt-3 text-ink-300">Track every rupee you earn from completed tasks and every transaction you make.</p>
              </div>
              <button onClick={loadWalletData} className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
          {stats.map((stat, index) => {
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
                <p className="font-display text-4xl mt-1 leading-none">
                  {stat.value}
                 
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bento p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="search-transactions-input"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'btn btn-primary' : 'btn btn-ghost'}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                onClick={() => setFilter('earn')}
                className={filter === 'earn' ? 'btn btn-cyan' : 'btn btn-ghost'}
                data-testid="filter-earn"
              >
                <TrendingUp className="w-4 h-4" />
                Earned
              </button>
              <button
                onClick={() => setFilter('spend')}
                className={filter === 'spend' ? 'btn btn-coral' : 'btn btn-ghost'}
                data-testid="filter-spend"
              >
                <TrendingDown className="w-4 h-4" />
                Spent
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bento p-0 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/10">
            <span className="chip chip-cyan mb-2"><Sparkles className="w-3 h-3" /> live ledger</span>
            <h2 className="font-display text-3xl md:text-4xl leading-tight flex items-center gap-3">
              Transaction <span className="italic text-gradient-cyan">history</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state m-6">
              <IndianRupee className="w-10 h-10 text-ink-400" />
              <p className="font-display text-2xl">No transactions found</p>
              <p className="text-sm text-ink-500 max-w-sm">
                {searchTerm || filter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Your transaction history will appear here as soon as you create or complete tasks.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {paginatedTransactions.map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.transaction_type, transaction.reason);
                  const isEarn = transaction.transaction_type === 'earn';
                  const palette = isEarn ? 'from-emerald-400 to-cyan-500' : 'from-coral-400 to-coral-600';

                  return (
                    <div
                      key={transaction.id || index}
                      className="px-6 md:px-8 py-5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                      data-testid="transaction-item"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${palette} text-white grid place-items-center shadow-soft shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-ink-950 dark:text-white truncate capitalize">
                              {transaction.reason?.replace(/_/g, ' ') || 'Transaction'}
                            </h3>
                            <span
                              className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                isEarn
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                  : 'bg-coral-500/15 text-coral-600 dark:text-coral-300'
                              }`}
                              data-testid="transaction-badge"
                            >
                              {isEarn ? 'Credit' : 'Debit'}
                            </span>
                          </div>
                          <p className="text-xs text-ink-500 dark:text-ink-300 mt-0.5">
                            {transaction.created_at
                              ? new Date(transaction.created_at).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Date unknown'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`font-display text-3xl leading-none ${isEarn ? 'text-emerald-500' : 'text-coral-500'}`}>
                            {isEarn ? '+' : '-'}{formatINR(transaction.amount)}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">INR</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="px-6 md:px-8 py-5 border-t border-black/5 dark:border-white/10 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs uppercase tracking-widest text-ink-500">
                    {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
                  </p>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-ghost p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={currentPage === i + 1 ? 'btn btn-primary px-4 py-2' : 'btn btn-ghost px-4 py-2'}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-ghost p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
