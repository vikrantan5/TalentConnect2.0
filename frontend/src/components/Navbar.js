import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Sparkles, Code2, Briefcase, ArrowLeftRight, Calendar,
  MessageSquare, Map, Award, Wallet, Bot, Bell, Sun, Moon, Menu, X,
  ChevronDown, User, Settings, LogOut, GraduationCap, Shield, Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { path: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/matches',      label: 'Match',       icon: Sparkles },
  { path: '/skills',       label: 'Skills',      icon: Code2 },
  { path: '/tasks',        label: 'Tasks',       icon: Briefcase },
  { path: '/exchange',     label: 'Exchange',    icon: ArrowLeftRight },
  { path: '/sessions',     label: 'Sessions',    icon: Calendar },
  { path: '/messages',     label: 'Messages',    icon: MessageSquare },
  { path: '/roadmap',      label: 'Roadmap',     icon: Map },
  { path: '/leaderboard',  label: 'Leaderboard', icon: Award },
  { path: '/wallet',       label: 'Wallet',      icon: Wallet },
  { path: '/chatbot',      label: 'AI',          icon: Bot },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [query, setQuery] = useState('');
  const notifCount = 3;
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpenProfile(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const active = (p) => location.pathname === p;

  const onLogout = () => { logout(); navigate('/login'); };

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      data-testid="navbar"
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled ? 'glass-strong shadow-soft' : 'bg-transparent'
      }`}
    >
      {/* thin gradient hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

      <div className="mx-auto max-w-[1480px] px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group" data-testid="nav-logo">
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-2xl blur-lg bg-cyan-400/40 opacity-0 group-hover:opacity-100 transition" />
              <span className="relative w-9 h-9 rounded-2xl bg-ink-950 text-cyan-300 grid place-items-center ring-1 ring-white/10">
                <GraduationCap className="w-5 h-5" />
              </span>
            </span>
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-[22px] text-ink-950 dark:text-white">Talent<span className="italic text-gradient-cyan">Connect</span></span>
              <span className="text-[10px] uppercase tracking-[.22em] text-ink-500 dark:text-ink-300">skill · mentor · grow</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-3xl">
            <div className="flex items-center gap-1 glass rounded-full px-1.5 py-1.5">
              {NAV.map((it) => {
                const Icon = it.icon;
                const a = active(it.path);
                return (
                  <Link
                    key={it.path}
                    to={it.path}
                    data-testid={`nav-${it.label.toLowerCase()}`}
                    className={`relative px-3 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
                      a ? 'text-white' : 'text-ink-700 dark:text-ink-200 hover:text-ink-950 dark:hover:text-white'
                    }`}
                  >
                    {a && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-ink-950 dark:bg-cyan-500/90 shadow-glow"
                      />
                    )}
                    <Icon className="relative w-3.5 h-3.5" />
                    <span className="relative">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {/* <div className="hidden md:flex items-center gap-2 glass rounded-full pl-3 pr-1 py-1">
              <Search className="w-4 h-4 text-ink-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills, people…"
                className="bg-transparent outline-none text-sm w-40 placeholder:text-ink-400"
                data-testid="nav-search"
              />
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ink-100 dark:bg-white/10 text-ink-600 dark:text-ink-200">⌘K</kbd>
            </div> */}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              data-testid="theme-toggle"
              className="relative w-9 h-9 rounded-full glass grid place-items-center hover:shadow-glow transition"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <Sun className="w-4 h-4 text-amber-300" />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <Moon className="w-4 h-4 text-ink-800" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* AI quick */}
            {/* <Link to="/chatbot" className="hidden sm:inline-flex btn btn-cyan px-4 py-2 text-xs" data-testid="nav-ai-btn">
              <Bot className="w-4 h-4" /> Ask AI
            </Link> */}

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-full glass grid place-items-center" data-testid="nav-bell">
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold">{notifCount}</span>
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-coral-500/60 animate-ping" />
                </>
              )}
            </button>

            {/* Profile */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setOpenProfile((v) => !v)}
                data-testid="nav-profile"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full glass hover:shadow-glow transition"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-ink-950 font-bold text-xs overflow-hidden">
                  {user?.profile_photo ? <img src={user.profile_photo} alt="" className="w-full h-full object-cover"/> : (user?.username?.[0] || 'U').toUpperCase()}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-ink-500 transition ${openProfile ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: .96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: .96 }}
                    transition={{ duration: .18 }}
                    className="absolute right-0 mt-2 w-64 glass-strong rounded-2xl p-2 shadow-soft-lg"
                  >
                    <div className="p-3 border-b border-black/5 dark:border-white/10">
                      <p className="font-semibold text-sm">{user?.full_name || user?.username || 'Guest'}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300 truncate">{user?.email || 'not signed in'}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" onClick={() => setOpenProfile(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-ink-100 dark:hover:bg-white/5">
                        <User className="w-4 h-4"/> Profile
                      </Link>
                      <Link to="/teams" onClick={() => setOpenProfile(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-ink-100 dark:hover:bg-white/5">
                        <Settings className="w-4 h-4"/> Teams & Settings
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setOpenProfile(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-ink-100 dark:hover:bg-white/5">
                          <Shield className="w-4 h-4"/> Admin
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-black/5 dark:border-white/10 pt-1">
                      <button
                        onClick={onLogout}
                        data-testid="logout-button"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-coral-500 hover:bg-coral-500/10"
                      >
                        <LogOut className="w-4 h-4"/> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile */}
            <button onClick={() => setOpenMobile((v) => !v)} className="lg:hidden w-9 h-9 rounded-full glass grid place-items-center" data-testid="nav-mobile-toggle">
              {openMobile ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <AnimatePresence>
          {openMobile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-3 grid grid-cols-2 gap-2">
                {NAV.map((it) => {
                  const Icon = it.icon;
                  const a = active(it.path);
                  return (
                    <Link
                      key={it.path}
                      to={it.path}
                      onClick={() => setOpenMobile(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium ${a ? 'bg-ink-950 text-white dark:bg-cyan-500 dark:text-ink-950' : 'glass'}`}
                    >
                      <Icon className="w-4 h-4"/> {it.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
