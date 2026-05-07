import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BrowseUsersModal from '../components/BrowseUsersModal';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  User, Mail, MapPin, Phone, Calendar, Edit2, Save, X, Camera, Award, Star,
  BookOpen, Briefcase, CheckCircle, Shield, Globe, Github, Twitter, Linkedin,
  LogOut, Settings, Bell, Download, Upload, Copy, Check, AlertCircle, Trophy,
  Target, TrendingUp, Users, Sparkles, BadgeCheck, GraduationCap, Brain, Rocket,
  Zap, Crown, Coins, FileText, Loader2, ExternalLink, ArrowUpRight, Medal, Clock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/* ─── tiny helper ─── */
const cn = (...classes) => classes.filter(Boolean).join(' ');

/* ─── Section Label (uppercase eyebrow) ─── */
const SectionLabel = ({ children }) => (
  <span className="inline-block text-[10px] font-bold tracking-[0.22em] uppercase text-ink-500 dark:text-ink-300 mb-3">
    {children}
  </span>
);

/* ─── Card wrapper (bento glass) ─── */
const Card = ({ children, className = '', glow = false, ...rest }) => (
  <div className={cn('bento', glow && 'bento-glow', className)} {...rest}>
    {children}
  </div>
);

/* ─── Stat Micro Card (cyan/coral/amber/indigo iconography) ─── */
const StatMicro = ({ icon: Icon, label, value, suffix, accent = 'cyan' }) => {
  const accents = {
    cyan:    'from-cyan-400 to-cyan-600',
    indigo:  'from-cyan-400 to-indigo-500',
    emerald: 'from-emerald-400 to-cyan-500',
    amber:   'from-amber-400 to-coral-400',
    violet:  'from-indigo-400 to-coral-400',
  };
  const grad = accents[accent] || accents.cyan;
  return (
    <div className="bento p-4 flex items-center gap-3" data-testid={`stat-${label.toLowerCase()}`}>
      <div className={cn('w-11 h-11 rounded-2xl grid place-items-center text-white shadow-soft bg-gradient-to-br', grad)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 truncate">{label}</p>
        <p className="font-display text-2xl text-ink-950 dark:text-white leading-tight tracking-tight">
          {value}{suffix || ''}
        </p>
      </div>
    </div>
  );
};
const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState({
    full_name: '', bio: '', location: '', phone: '', website: '',
    github: '', twitter: '', linkedin: '', skills: [], interests: [],
    languages: [], education: '', company: '', jobTitle: ''
  });
  const [bankDetails, setBankDetails] = useState({
    account_number: '', ifsc_code: '', account_holder_name: '',
    bank_name: '', upi_id: '', preferred_payout_mode: 'bank_transfer'
  });
  const [userStats, setUserStats] = useState({ total_sessions: 0, total_tasks_completed: 0, average_rating: 0, total_mentees: 0 });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState({ completion_percentage: 0, missing_fields: [] });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const coverInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [trustScore, setTrustScore] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenTransactions, setTokenTransactions] = useState([]);
  const [loadingTrust, setLoadingTrust] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);
  const [showBrowseUsers, setShowBrowseUsers] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState([]);

  /* ─── handlers (unchanged logic) ─── */
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${BACKEND_URL}/api/users/me`, {
        full_name: profileData.full_name, bio: profileData.bio,
        location: profileData.location, phone: profileData.phone,
        website: profileData.website, github: profileData.github,
        twitter: profileData.twitter, linkedin: profileData.linkedin,
        company: profileData.company, job_title: profileData.jobTitle
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Profile updated successfully!');
      setIsEditing(false);
      loadProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSaveBankDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${BACKEND_URL}/api/users/me`, { bank_details: bankDetails }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Bank details saved successfully!');
      loadProfileData();
    } catch (error) {
      console.error('Error saving bank details:', error);
      alert('Failed to save bank details: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(`https://talentconnect.com/profile/${user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = async (type, file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) { alert('Invalid file type.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
    type === 'avatar' ? setUploadingAvatar(true) : setUploadingCover(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const endpoint = type === 'avatar'
        ? `${BACKEND_URL}/api/users/upload-profile-photo`
        : `${BACKEND_URL}/api/users/upload-background-photo`;
      const response = await axios.post(endpoint, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'avatar') {
        setAvatar(response.data.photo_url);
        setProfileData(prev => ({ ...prev, profile_photo: response.data.photo_url }));
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.profile_photo = response.data.photo_url;
        localStorage.setItem('user', JSON.stringify(storedUser));
      } else {
        setCoverImage(response.data.photo_url);
        setProfileData(prev => ({ ...prev, background_photo: response.data.photo_url }));
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.background_photo = response.data.photo_url;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
      alert(response.data.message);
      await loadProfileData();
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Failed to upload ${type}: ` + (error.response?.data?.detail || error.message));
    } finally {
      type === 'avatar' ? setUploadingAvatar(false) : setUploadingCover(false);
    }
  };

  /* ─── data loaders (unchanged logic) ─── */
  useEffect(() => {
    if (user?.id) {
      loadProfileData(); loadTrustScore(); loadTokenBalance();
      loadTokenTransactions(); loadUpcomingSessions(); loadConnections();
      loadProfileCompletion(); loadConnectionRequests();
    }
  }, [user]);

  const loadProfileData = async () => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = response.data;
      setProfileData({
        full_name: d.full_name || '', bio: d.bio || '', location: d.location || '',
        phone: d.phone || '', website: d.website || '', github: d.github || '',
        twitter: d.twitter || '', linkedin: d.linkedin || '', skills: d.skills || [],
        interests: d.interests || [], languages: d.languages || [], education: d.education || '',
        company: d.company || '', jobTitle: d.job_title || ''
      });
      d.profile_photo ? setAvatar(d.profile_photo) : setAvatar(null);
      d.background_photo ? setCoverImage(d.background_photo) : setCoverImage(null);
      await loadUserStats(); await loadActivities(); await loadAchievements();
    } catch (error) { console.error('Error loading profile data:', error); }
    setLoadingProfile(false);
  };

  const loadUserStats = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/me/stats`, { headers: { Authorization: `Bearer ${token}` } }); setUserStats(r.data); } catch (e) { console.error(e); } };
  const loadUpcomingSessions = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/upcoming-sessions`, { headers: { Authorization: `Bearer ${token}` } }); setUpcomingSessions(r.data.sessions || []); } catch (e) { console.error(e); } };
  const loadConnections = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/connections`, { headers: { Authorization: `Bearer ${token}` } }); setConnections(r.data.connections || []); } catch (e) { console.error(e); } };
  const loadProfileCompletion = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/profile-completion`, { headers: { Authorization: `Bearer ${token}` } }); setProfileCompletion(r.data); } catch (e) { console.error(e); } };
  const loadTrustScore = async () => { setLoadingTrust(true); try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/reputation/trust-score/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }); setTrustScore(r.data); } catch (e) { console.error(e); } setLoadingTrust(false); };
  const loadTokenBalance = async () => { setLoadingTokens(true); try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/token-balance`, { headers: { Authorization: `Bearer ${token}` } }); setTokenBalance(r.data); } catch (e) { console.error(e); } setLoadingTokens(false); };
  const loadTokenTransactions = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/token-transactions?limit=10`, { headers: { Authorization: `Bearer ${token}` } }); setTokenTransactions(r.data.transactions || []); } catch (e) { console.error(e); } };
  const loadActivities = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/my-activities?limit=20`, { headers: { Authorization: `Bearer ${token}` } }); setRecentActivity(r.data.activities || []); } catch (e) { console.error(e); } };
  const loadAchievements = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/achievements`, { headers: { Authorization: `Bearer ${token}` } }); setAchievements(r.data.achievements || []); } catch (e) { console.error(e); } };
  const loadConnectionRequests = async () => { try { const token = localStorage.getItem('token'); const r = await axios.get(`${BACKEND_URL}/api/users/connection-requests`, { headers: { Authorization: `Bearer ${token}` } }); setConnectionRequests(r.data.requests || []); } catch (e) { console.error(e); } };

  const handleConnectionResponse = async (connectionId, accept) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/users/connections/respond/${connectionId}`, { accept }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Connection request ${accept ? 'accepted' : 'rejected'}!`);
      loadConnectionRequests(); loadConnections();
    } catch (error) { console.error(error); alert('Failed to respond to connection request'); }
  };

  const handleResumeUpload = async (file) => {
    setUploadingResume(true); setResumeResult(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file); formData.append('auto_add', 'true');
      const response = await axios.post(`${BACKEND_URL}/api/skills/upload-resume`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setResumeResult(response.data);
      alert(`Resume uploaded! ${response.data.auto_add_result?.added_count || 0} skills added to your profile.`);
      await loadProfileData();
    } catch (error) { console.error(error); alert('Failed to upload resume: ' + (error.response?.data?.detail || error.message)); }
    setUploadingResume(false);
  };

  const getTrustBadge = (score) => {
    if (!score) return { label: 'New User', color: 'slate', icon: Shield };
    if (score >= 90) return { label: 'Gold Mentor', color: 'amber', icon: Crown };
    if (score >= 75) return { label: 'Silver Mentor', color: 'slate', icon: Medal };
    if (score >= 60) return { label: 'Bronze Mentor', color: 'orange', icon: Award };
    return { label: 'Aspiring', color: 'indigo', icon: Rocket };
  };

  /* ─── Tabs definition ─── */
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'skills', label: 'Skills', icon: Brain },
    { id: 'payment', label: 'Payment', icon: Coins },
    { id: 'activity', label: 'Activity', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ];

  const completionPct = profileCompletion.completion_percentage || 0;
  const trustBadge = getTrustBadge(trustScore?.trust_score);
  const TrustIcon = trustBadge.icon;

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="profile-page">
      {/* Aurora background blobs */}
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[400px] h-[400px] left-[40%] bottom-[-8rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-10s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Aurora background blobs */}
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[400px] h-[400px] left-[40%] bottom-[-8rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-10s' }} />

      {/* <Navbar /> */}

      {/* ─── Cover Image ─── */}
      <div className="relative h-52 md:h-72 overflow-hidden" data-testid="cover-image-section">
        {coverImage ? (
          <>
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/30 to-transparent" />
          </>
        ) : (
          <div
            className="relative w-full h-full bg-ink-950"
            style={{
              backgroundImage:
                'radial-gradient(600px 400px at 12% 10%, rgba(34,211,238,.45), transparent 60%), radial-gradient(700px 500px at 88% 90%, rgba(255,106,91,.40), transparent 60%), radial-gradient(900px 700px at 50% 50%, rgba(99,102,241,.25), transparent 60%)',
            }}
          />
        )}
        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="btn btn-ghost absolute bottom-5 right-5 text-white border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur disabled:opacity-50"
          data-testid="change-cover-button"
        >
          {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          Change cover
        </button>
        <input type="file" ref={coverInputRef} className="hidden" accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleImageUpload('cover', e.target.files[0])} />
      </div>

      {/* ─── Main Container ─── */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 -mt-16 pb-12 relative z-10">

        {/* ─── Top Row: Avatar + Name + Actions ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0" data-testid="avatar-section">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl ring-4 ring-white dark:ring-ink-900 bg-white dark:bg-ink-900 shadow-soft-lg overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center">
                    <span className="font-display text-5xl text-white">{user?.username?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*"
                onChange={(e) => { if (e.target.files?.[0]) { handleImageUpload('avatar', e.target.files[0]); setShowAvatarMenu(false); } }} />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-ink-950 dark:bg-white text-cyan-300 dark:text-ink-950 rounded-2xl grid place-items-center shadow-soft transition-transform hover:scale-105 disabled:opacity-50 ring-2 ring-white dark:ring-ink-900"
                data-testid="change-avatar-button"
              >
                {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>

            {/* Name Block */}
            <div className="pb-1">
              <span className="chip chip-cyan mb-3">
                <Sparkles className="w-3 h-3" /> profile
              </span>
              <div className="flex items-center gap-2 mt-2 mb-2">
                <h1 className="font-display text-4xl md:text-5xl leading-[1] tracking-tight" data-testid="profile-name">
                  {user?.full_name || user?.username}
                </h1>
                {user?.is_verified && <BadgeCheck className="w-6 h-6 text-cyan-500" />}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-ink-500 dark:text-ink-300">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />@{user?.username}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user?.email}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2024'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleCopyProfileLink}
              className="btn btn-ghost"
              data-testid="copy-profile-link-button">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Share'}
            </button>
            <button onClick={() => setShowSettings(true)}
              className="btn btn-ghost px-3"
              data-testid="settings-button">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => setIsEditing(!isEditing)}
              className={cn('btn', isEditing ? 'btn-ghost text-coral-500' : 'btn-cyan')}
              data-testid="edit-profile-button">
              {isEditing ? <><X className="w-4 h-4" />Cancel</> : <><Edit2 className="w-4 h-4" />Edit profile</>}
            </button>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10" data-testid="stats-row">
         <StatMicro icon={BookOpen} label="Sessions" value={userStats.total_sessions} accent="cyan" />
          <StatMicro icon={Briefcase} label="Tasks" value={userStats.total_tasks_completed} accent="emerald" />
          <StatMicro icon={Star} label="Rating" value={userStats.average_rating?.toFixed(1) || '0.0'} accent="amber" />
          <StatMicro icon={Users} label="Mentees" value={userStats.total_mentees} accent="violet" />
        </div>

        {/* ─── Grid: Sidebar + Content ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ─── LEFT SIDEBAR ─── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Trust Score */}
            <Card className="p-5" data-testid="trust-score-card">
              <SectionLabel>Trust Score</SectionLabel>
              {loadingTrust ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
              ) : trustScore ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold text-slate-900 tracking-tight font-heading">{trustScore.trust_score || 0}</div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100">
                      <TrustIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">{trustBadge.label}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-[#4338CA] to-violet-500 rounded-full transition-all" style={{ width: `${Math.min(trustScore.trust_score || 0, 100)}%` }} />
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Verified Skills', value: trustScore.stats?.verified_skills_count || 0 },
                      { label: 'Response Rate', value: `${trustScore.stats?.response_rate || 0}%` },
                      { label: 'Total Sessions', value: trustScore.stats?.total_sessions || 0 },
                      { label: 'Avg Rating', value: trustScore.stats?.average_rating?.toFixed(1) || '0.0' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-body">{item.label}</span>
                        <span className="font-semibold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-slate-400 py-4 text-center">No data available</p>}
            </Card>

            {/* Token Balance — ink-950 with aurora */}
            <Card className="p-6 bg-ink-950 text-white border-0 relative overflow-hidden" data-testid="token-balance-card">
              <div className="absolute inset-0 opacity-70 pointer-events-none" style={{ background: 'radial-gradient(420px 240px at 100% -10%, rgba(34,211,238,.32), transparent 60%), radial-gradient(360px 260px at -10% 110%, rgba(255,106,91,.25), transparent 60%)' }} />
              <div className="relative">
                <span className="chip chip-cyan mb-3"><Coins className="w-3 h-3" /> skill tokens</span>
                {loadingTokens ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-white/60 animate-spin" /></div>
                ) : tokenBalance ? (
                  <>
                    <div className="flex items-baseline gap-3 mt-3 mb-5">
                      <span className="font-display text-6xl tracking-tight leading-none">{tokenBalance.balance || 0}</span>
                      <span className="text-xs text-ink-300 uppercase tracking-widest">tokens</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-2xl p-3 bg-white/5 ring-1 ring-white/10">
                        <p className="text-[10px] text-cyan-300 uppercase tracking-widest mb-1">Earned</p>
                        <p className="font-display text-2xl">{tokenBalance.total_earned || 0}</p>
                      </div>
                      <div className="rounded-2xl p-3 bg-white/5 ring-1 ring-white/10">
                        <p className="text-[10px] text-coral-300 uppercase tracking-widest mb-1">Spent</p>
                        <p className="font-display text-2xl">{tokenBalance.total_spent || 0}</p>
                      </div>
                    </div>
                    {tokenTransactions.length > 0 && (
                      <div className="rounded-2xl p-3 bg-white/5 ring-1 ring-white/10 mb-4">
                        <p className="text-[10px] text-ink-300 uppercase tracking-widest mb-2">Recent</p>
                        <div className="space-y-1.5">
                          {tokenTransactions.slice(0, 3).map((tx, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-white/80 truncate mr-2">{tx.reason?.replace(/_/g, ' ')}</span>
                              <span className={cn('font-semibold flex-shrink-0', tx.transaction_type === 'earn' ? 'text-emerald-300' : 'text-coral-300')}>
                                {tx.transaction_type === 'earn' ? '+' : '-'}{tx.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <a href="/wallet" className="btn btn-cyan w-full" data-testid="view-all-transactions-link">
                      View wallet <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </>
                ) : <p className="text-sm text-white/60 py-4 text-center">No token data</p>}
              </div>
            </Card>

            {/* Profile Completion */}
            <Card className="p-5" data-testid="profile-completion-card">
              <SectionLabel>Profile Completion</SectionLabel>
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', completionPct === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700')}>
                  {completionPct === 100 ? 'Complete' : 'In Progress'}
                </span>
                <span className="text-sm font-bold text-slate-900">{completionPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-[#4338CA] rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="space-y-2">
                {['Basic Info', 'Skills Added', 'Profile Picture', 'Verification', 'Connections'].map((item) => {
                  const missing = profileCompletion.missing_fields?.includes(item);
                  return (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      {missing ? <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      <span className={cn('font-body', missing ? 'text-slate-500' : 'text-slate-700')}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Connection Requests */}
            {connectionRequests.length > 0 && (
              <Card className="p-5" data-testid="connection-requests-card">
                <SectionLabel>Connection Requests</SectionLabel>
                <div className="space-y-3">
                  {connectionRequests.slice(0, 3).map((request) => (
                    <div key={request.connection_id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                          {request.sender.profile_photo ? (
                            <img src={request.sender.profile_photo} alt="" className="w-full h-full object-cover" />
                          ) : request.sender.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{request.sender.full_name || request.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleConnectionResponse(request.connection_id, true)}
                          className="flex-1 py-1.5 text-xs font-semibold bg-[#4338CA] text-white rounded-md hover:bg-[#3730A3] transition-colors" data-testid={`accept-connection-${request.connection_id}`}>
                          Accept
                        </button>
                        <button onClick={() => handleConnectionResponse(request.connection_id, false)}
                          className="flex-1 py-1.5 text-xs font-semibold bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors" data-testid={`reject-connection-${request.connection_id}`}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* ─── RIGHT CONTENT ─── */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Tabs Navigation */}
            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto" data-testid="profile-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                      active ? 'text-[#4338CA] border-[#4338CA]' : 'text-slate-500 border-transparent hover:text-slate-800'
                    )}
                    data-testid={`tab-${tab.id}`}>
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── TAB: Personal Info ── */}
            {activeTab === 'personal' && (
              <div className="space-y-5">
                {/* Bio */}
                <Card className="p-6" data-testid="bio-card">
                  <SectionLabel>About</SectionLabel>
                  {isEditing ? (
                    <textarea className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none font-body resize-none"
                      rows="4" value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      data-testid="bio-input" placeholder="Tell us about yourself..." />
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed font-body">{profileData.bio || 'No bio added yet.'}</p>
                  )}
                </Card>

                {/* Personal Info Grid */}
                <Card className="p-6" data-testid="personal-info-card">
                  <SectionLabel>Details</SectionLabel>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { icon: User, label: 'Full Name', value: profileData.full_name, key: 'full_name' },
                      { icon: MapPin, label: 'Location', value: profileData.location, key: 'location' },
                      { icon: Phone, label: 'Phone', value: profileData.phone, key: 'phone' },
                      { icon: Globe, label: 'Website', value: profileData.website, key: 'website' },
                      { icon: Briefcase, label: 'Company', value: profileData.company, key: 'company' },
                      { icon: Award, label: 'Job Title', value: profileData.jobTitle, key: 'jobTitle' },
                    ].map((field) => {
                      const Icon = field.icon;
                      return (
                        <div key={field.key} className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-1">{field.label}</p>
                            {isEditing ? (
                              <input type="text" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none font-body"
                                value={profileData[field.key]}
                                onChange={(e) => setProfileData({ ...profileData, [field.key]: e.target.value })} />
                            ) : (
                              <p className="text-sm font-medium text-slate-800 font-body truncate">{field.value || '-'}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Social Links */}
                <Card className="p-6" data-testid="social-links-card">
                  <SectionLabel>Social</SectionLabel>
                  <div className="space-y-3">
                    {[
                      { icon: Github, label: 'GitHub', value: profileData.github, key: 'github' },
                      { icon: Twitter, label: 'Twitter', value: profileData.twitter, key: 'twitter' },
                      { icon: Linkedin, label: 'LinkedIn', value: profileData.linkedin, key: 'linkedin' },
                    ].map((social) => {
                      const Icon = social.icon;
                      return (
                        <div key={social.key} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-slate-500" />
                          </div>
                          {isEditing ? (
                            <input type="text" className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none font-body"
                              value={social.value} placeholder={`Your ${social.label} URL`}
                              onChange={(e) => setProfileData({ ...profileData, [social.key]: e.target.value })} />
                          ) : social.value ? (
                            <a href={social.value.startsWith('http') ? social.value : `https://${social.value}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-[#4338CA] hover:underline font-body">
                              {social.value} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-sm text-slate-400 font-body">Not added</span>}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {isEditing && (
                  <button onClick={handleSave}
                    className="btn btn-cyan w-full py-3"
                    data-testid="save-profile-button">
                    <Save className="w-4 h-4" /> Save changes
                  </button>
                )}
              </div>
            )}

            {/* ── TAB: Skills ── */}
            {activeTab === 'skills' && (
              <div className="space-y-5">
                {/* Resume Upload */}
                <Card className="p-7 bg-ink-950 text-white border-0 relative overflow-hidden" data-testid="resume-upload-card">
                  <div className="absolute inset-0 opacity-70 pointer-events-none" style={{ background: 'radial-gradient(500px 280px at 100% -10%, rgba(255,106,91,.32), transparent 60%), radial-gradient(420px 260px at -10% 110%, rgba(34,211,238,.22), transparent 60%)' }} />
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="chip chip-coral mb-3"><FileText className="w-3 h-3" /> resume</span>
                      <h3 className="font-display text-3xl mt-2 leading-tight">
                        Upload <span className="italic text-gradient-cyan">resume</span>
                      </h3>
                      <p className="text-sm text-ink-300 mt-1">Drop a PDF/DOCX and we&apos;ll auto-import your skills.</p>
                    </div>
                    <div>
                      <input type="file" ref={resumeInputRef} className="hidden" accept=".pdf,.docx,.doc"
                        onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} />
                      <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}
                        className="btn btn-cyan disabled:opacity-50"
                        data-testid="upload-resume-button">
                        {uploadingResume ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Upload resume</>}
                      </button>
                    </div>
                  </div>
                  {resumeResult && (
                    <div className="relative mt-4 rounded-2xl p-3 text-sm bg-white/5 ring-1 ring-white/10">
                      <p className="font-semibold mb-1">Resume processed!</p>
                      <p className="text-ink-300">Skills Found: {resumeResult.parse_result?.total_skills_found || 0} · Added: {resumeResult.auto_add_result?.added_count || 0} · Skipped: {resumeResult.auto_add_result?.skipped_count || 0}</p>
                    </div>
                  )}
                </Card>

                {/* Skills Grid */}
                <Card className="p-6" data-testid="skills-list-card">
                  <SectionLabel>Skills & Expertise</SectionLabel>
                  {profileData.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 text-sm font-medium text-[#4338CA] bg-indigo-50 border border-indigo-100 rounded-lg">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 font-body py-4">No skills added yet. Upload your resume to get started!</p>
                  )}
                </Card>
              </div>
            )}

            {/* ── TAB: Payment ── */}
            {activeTab === 'payment' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Test Mode Active</p>
                    <p className="text-xs text-amber-700">No real money will be transferred. Bank details are optional until production.</p>
                  </div>
                </div>

                <Card className="p-6" data-testid="bank-details-card">
                  <SectionLabel>Bank Account Details</SectionLabel>
                  <div className="space-y-4 mt-2">
                    {[
                      { label: 'Account Holder Name', key: 'account_holder_name', placeholder: 'Enter name' },
                      { label: 'Account Number', key: 'account_number', placeholder: 'Enter account number' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                        <input type="text" value={bankDetails[f.key]}
                          onChange={(e) => setBankDetails({ ...bankDetails, [f.key]: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none"
                          placeholder={f.placeholder} />
                      </div>
                    ))}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">IFSC Code</label>
                        <input type="text" value={bankDetails.ifsc_code}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none"
                          placeholder="IFSC Code" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank Name</label>
                        <input type="text" value={bankDetails.bank_name}
                          onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none"
                          placeholder="Bank Name" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">UPI ID (Optional)</label>
                      <input type="text" value={bankDetails.upi_id}
                        onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none"
                        placeholder="yourname@upi" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payout Mode</label>
                      <select value={bankDetails.preferred_payout_mode}
                        onChange={(e) => setBankDetails({ ...bankDetails, preferred_payout_mode: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-[#4338CA] focus:border-transparent outline-none">
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                    <button onClick={handleSaveBankDetails}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4338CA] rounded-lg hover:bg-[#3730A3] transition-colors"
                      data-testid="save-bank-details-button">
                      <Save className="w-4 h-4" /> Save Bank Details
                    </button>
                  </div>
                </Card>

                <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                  <Shield className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-sky-900">Secure & Encrypted</p>
                    <p className="text-xs text-sky-700">Your bank details are encrypted and stored securely.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Activity ── */}
            {activeTab === 'activity' && (
              <Card className="p-6" data-testid="activity-card">
                <SectionLabel>Recent Activity</SectionLabel>
                {recentActivity.length > 0 ? (
                  <div className="space-y-1">
                    {recentActivity.map((activity, index) => {
                      const iconMap = { 'BookOpen': BookOpen, 'Briefcase': Briefcase, 'Star': Star, 'Users': Users };
                      const Icon = iconMap[activity.icon] || BookOpen;
                      const timeAgo = activity.time ? new Date(activity.time).toLocaleString() : 'Recently';
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                            <p className="text-xs text-slate-500">with {activity.user}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{timeAgo}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center font-body">No recent activity</p>
                )}
              </Card>
            )}

            {/* ── TAB: Achievements ── */}
            {activeTab === 'achievements' && (
              <div data-testid="achievements-section">
                {achievements.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => {
                      const iconMap = { 'Trophy': Trophy, 'Medal': Medal, 'Crown': Crown, 'Target': Target, 'Rocket': Rocket };
                      const Icon = iconMap[achievement.icon] || Trophy;
                      return (
                        <Card key={index} className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{achievement.date}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-1 font-heading">{achievement.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-body">{achievement.description}</p>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 font-body">Keep learning and earning achievements!</p>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Settings Sidebar ─── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setShowSettings(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-slate-200 p-6 animate-slideIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 font-heading">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" data-testid="close-settings-button">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-1">
              {[
                { icon: Bell, label: 'Notifications' },
                { icon: Shield, label: 'Privacy' },
                { icon: Download, label: 'Export Data' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    <Icon className="w-4 h-4 text-slate-400" /> {item.label}
                  </button>
                );
              })}
              <div className="border-t border-slate-200 my-3" />
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                data-testid="logout-settings-button">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Users Modal */}
      <BrowseUsersModal isOpen={showBrowseUsers} onClose={() => setShowBrowseUsers(false)} />

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slideIn { animation: slideIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default Profile;
