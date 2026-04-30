import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, GraduationCap, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Register = () => {
  const { register } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', username: '', password: '', full_name: '', location: '', phone: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = (() => {
    const pw = formData.password || '';
    if (!pw) return 0;
    if (pw.length < 8) return 25;
    let s = 50;
    if (/[A-Z]/.test(pw)) s += 25;
    if (/[0-9]/.test(pw)) s += 25;
    return Math.min(s, 100);
  })();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await register(formData);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error || 'Registration failed');
  };

  return (
    <div className="min-h-screen aurora-bg grid-bg relative overflow-hidden text-ink-950 dark:text-white flex">
      <div className="blob w-[520px] h-[520px] -left-40 -top-40 bg-coral-400/35" />
      <div className="blob w-[420px] h-[420px] -right-20 top-40 bg-cyan-400/35" />

      <div className="hidden lg:flex lg:w-[40%] relative p-10">
        <div className="absolute inset-6 rounded-[32px] bg-ink-950 text-white p-10 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(600px 500px at 80% 0%, rgba(255,106,91,.4), transparent 60%), radial-gradient(600px 400px at 10% 100%, rgba(34,211,238,.35), transparent 60%)' }}/>
          <Link to="/" className="relative inline-flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-white/10 grid place-items-center ring-1 ring-white/20 text-cyan-300"><GraduationCap className="w-5 h-5"/></span>
            <span className="font-display text-2xl">Talent<span className="italic text-gradient-cyan">Connect</span></span>
          </Link>
          <div className="relative">
            <Sparkles className="w-6 h-6 text-coral-300 mb-6"/>
            <h2 className="font-display text-5xl leading-[.95]">Build your <span className="italic text-gradient">career</span> in a browser tab.</h2>
            <p className="mt-5 text-ink-300 max-w-sm">Sign up in 60 seconds. Get matched with mentors, trade skills, and earn tokens from day one.</p>
          </div>
          <div className="relative grid grid-cols-3 gap-3 text-xs text-ink-300">
            <Stat v="38.4k" l="learners"/>
            <Stat v="12.1k" l="mentors"/>
            <Stat v="₹4.2Cr" l="rewarded"/>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-10">
            <Link to="/" className="flex items-center gap-2.5 lg:hidden">
              <span className="w-8 h-8 rounded-xl bg-ink-950 text-cyan-300 grid place-items-center"><GraduationCap className="w-4 h-4"/></span>
              <span className="font-display text-xl">TalentConnect</span>
            </Link>
            <button onClick={toggle} className="ml-auto w-9 h-9 rounded-full glass grid place-items-center" data-testid="register-theme">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300"/> : <Moon className="w-4 h-4"/>}
            </button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
            <span className="chip chip-coral mb-4">join free</span>
            <h1 className="font-display text-5xl leading-[.95]">Create your<br/>account.</h1>
            <p className="mt-3 text-ink-500 dark:text-ink-300">Already a member? <Link to="/login" className="text-ink-950 dark:text-white font-semibold underline underline-offset-4">Sign in</Link></p>
          </motion.div>

          <form onSubmit={submit} className="mt-8 space-y-4" data-testid="register-form">
            {error && <div className="chip chip-coral w-full justify-center py-2" data-testid="register-error">{error}</div>}
            <Field label="Full name" value={formData.full_name} onChange={(v) => setFormData({ ...formData, full_name: v })} testid="register-fullname"/>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username" value={formData.username} onChange={(v) => setFormData({ ...formData, username: v })} testid="register-username"/>
              <Field label="Email" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} testid="register-email"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location" value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })} testid="register-location"/>
              <Field label="Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} testid="register-phone"/>
            </div>
            <Field label="Password" type={showPw ? 'text' : 'password'} value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} testid="register-password"
              trailing={
                <button type="button" onClick={() => setShowPw(v => !v)} className="text-ink-400 hover:text-ink-900 dark:hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              }
            />
            {formData.password && (
              <div>
                <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${strength}%`, background: strength < 50 ? '#ef4444' : strength < 75 ? '#f59e0b' : '#22c55e' }}/>
                </div>
                <p className="mt-1 text-xs text-ink-500">{strength < 50 ? 'Weak' : strength < 75 ? 'Good' : 'Strong'} password</p>
              </div>
            )}

            <button disabled={loading} className="w-full btn btn-coral py-3 text-base disabled:opacity-60" data-testid="register-submit">
              {loading ? 'Creating…' : <>Create account <ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ v, l }) => (
  <div className="glass rounded-xl p-3">
    <p className="font-display text-2xl text-white">{v}</p>
    <p className="text-[10px] uppercase tracking-widest">{l}</p>
  </div>
);

const Field = ({ label, type = 'text', value, onChange, trailing, testid }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">{label}</span>
    <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
      <input type={type} value={value} required onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" data-testid={testid}/>
      {trailing}
    </div>
  </label>
);

export default Register;
