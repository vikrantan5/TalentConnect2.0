import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, GraduationCap, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await login(formData);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error || 'Login failed');
  };

  return (
    <div className="min-h-screen aurora-bg grid-bg relative overflow-hidden text-ink-950 dark:text-white flex">
      <div className="blob w-[520px] h-[520px] -left-40 -top-40 bg-cyan-400/35" />
      <div className="blob w-[420px] h-[420px] -right-20 top-40 bg-coral-400/35" />

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] relative p-10">
        <div className="absolute inset-6 rounded-[32px] bg-ink-950 text-white p-10 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(600px 400px at 20% 0%, rgba(34,211,238,.4), transparent 60%), radial-gradient(600px 500px at 80% 100%, rgba(255,106,91,.35), transparent 60%)' }}/>
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-white/10 grid place-items-center ring-1 ring-white/20 text-cyan-300">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="font-display text-2xl">Talent<span className="italic text-gradient-cyan">Connect</span></span>
            </Link>
          </div>
          <div className="relative">
            <Sparkles className="w-6 h-6 text-cyan-300 mb-6"/>
            <h2 className="font-display text-5xl leading-[.95]">Welcome back to the <span className="italic text-gradient">skill-trade</span> era.</h2>
            <p className="mt-5 text-ink-300 max-w-sm">Pick up where you left off — your AI copilot has fresh roadmap nudges waiting.</p>
          </div>
          <div className="relative flex items-center gap-4">
            <div className="flex -space-x-2">
              {[0,1,2].map(i => (
                <span key={i} className={`w-9 h-9 rounded-full ring-2 ring-ink-950 bg-gradient-to-br ${['from-cyan-400 to-indigo-500','from-coral-400 to-pink-500','from-amber-300 to-coral-400'][i]}`}/>
              ))}
            </div>
            <p className="text-sm text-ink-300">Joined today by <b className="text-white">218</b> learners.</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-10">
            <Link to="/" className="flex items-center gap-2.5 lg:hidden">
              <span className="w-8 h-8 rounded-xl bg-ink-950 text-cyan-300 grid place-items-center"><GraduationCap className="w-4 h-4"/></span>
              <span className="font-display text-xl">TalentConnect</span>
            </Link>
            <button onClick={toggle} className="ml-auto w-9 h-9 rounded-full glass grid place-items-center" data-testid="login-theme-toggle">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300"/> : <Moon className="w-4 h-4"/>}
            </button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
            <span className="chip chip-cyan mb-4">sign in</span>
            <h1 className="font-display text-5xl leading-[.95]">Good to see you<br/>again.</h1>
            <p className="mt-3 text-ink-500 dark:text-ink-300">Don’t have an account? <Link to="/register" className="text-ink-950 dark:text-white font-semibold underline underline-offset-4">Create one</Link></p>
          </motion.div>

          <form onSubmit={submit} className="mt-8 space-y-4" data-testid="login-form">
            {error && (
              <div className="chip chip-coral w-full justify-center py-2" data-testid="login-error">{error}</div>
            )}
            <Field label="Email" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} testid="login-email" />
            <Field label="Password" type={showPw ? 'text' : 'password'} value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} testid="login-password"
              trailing={
                <button type="button" onClick={() => setShowPw(v => !v)} className="text-ink-400 hover:text-ink-900 dark:hover:text-white" data-testid="login-toggle-password">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-500"><input type="checkbox" className="accent-cyan-500"/> Remember me</label>
              <a href="#" className="text-ink-950 dark:text-white font-medium hover:underline">Forgot password?</a>
            </div>

            <button disabled={loading} className="w-full btn btn-coral py-3 text-base disabled:opacity-60" data-testid="login-submit">
              {loading ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>

          <div className="my-8 flex items-center gap-3 text-xs text-ink-400"><span className="flex-1 h-px bg-black/10 dark:bg-white/10"/> OR <span className="flex-1 h-px bg-black/10 dark:bg-white/10"/></div>

          <button type="button" className="w-full btn btn-ghost py-3" data-testid="login-google">
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.5-4.5H24v9h12.7c-.5 3-2.2 5.6-4.8 7.3l7.4 5.8c4.3-4 7.2-10 7.2-17.6z"/><path fill="#FBBC05" d="M10.3 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.7 0 20.2 0 24c0 3.8.9 7.3 2.5 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.8c-2 1.4-4.6 2.3-8.4 2.3-6.3 0-11.7-4-13.7-9.7l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, type = 'text', value, onChange, trailing, testid }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">{label}</span>
    <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
      <input
        type={type}
        value={value}
        required
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm"
        data-testid={testid}
      />
      {trailing}
    </div>
  </label>
);

export default Login;
