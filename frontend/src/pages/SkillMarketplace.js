import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FindMentorModal from '../components/FindMentorModal';
import SkillQuizModal from '../components/SkillQuizModal';
import MentorDetailModal from '../components/MentorDetailModal';
import { skillService } from '../services/apiService';
import {
  Search,
  Plus,
  X,
  CheckCircle,
  Award,
  Star,
  Clock,
  TrendingUp,
  Filter,
  Grid as GridIcon,
  List as ListIcon,
  BookOpen,
  GraduationCap,
  Sparkles,
  Shield,
  Users,
  Calendar,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Check,
  Briefcase,
  Crown,
  Target,
  Compass,
  Edit2,
  ArrowRight,
} from 'lucide-react';

const SkillMarketplace = () => {
  const [activeTab, setActiveTab] = useState('my-skills');
  const [mySkills, setMySkills] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [mentorLearnerMatches, setMentorLearnerMatches] = useState({ recommended_mentors: [], recommended_learners: [] });
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [searchSkill, setSearchSkill] = useState('');
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_type: 'offered',
    skill_level: 'intermediate',
    description: '',
    years_experience: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [viewMode, setViewMode] = useState('grid');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showSkillDetails, setShowSkillDetails] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestData, setRequestData] = useState({
    date: '',
    time: '',
    duration: 60,
    message: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editSkill, setEditSkill] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [findMentorModal, setFindMentorModal] = useState({ show: false, skill: '' });
  const [skillQuizModal, setSkillQuizModal] = useState({ show: false, skill: '', level: 'intermediate' });
  const [selectedMentorDetail, setSelectedMentorDetail] = useState(null);
  const [showMentorDetailModal, setShowMentorDetailModal] = useState(false);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillData = {
        skill_name: newSkill.skill_name,
        skill_type: newSkill.skill_type,
        skill_level: newSkill.skill_level,
        description: newSkill.description || undefined,
      };

      if (newSkill.skill_type === 'offered') {
        if (newSkill.years_experience) {
          skillData.years_experience = parseInt(newSkill.years_experience);
        }
      }

      await skillService.addSkill(skillData);
      setShowAddSkill(false);
      setNewSkill({
        skill_name: '',
        skill_type: 'offered',
        skill_level: 'intermediate',
        description: '',
        years_experience: '',
      });
      showNotification('Skill added successfully!', 'success');
      loadMySkills();
    } catch (error) {
      showNotification('Failed to add skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const handleEditSkill = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillData = {
        skill_name: newSkill.skill_name,
        skill_type: newSkill.skill_type,
        skill_level: newSkill.skill_level,
        description: newSkill.description || undefined,
      };

      if (newSkill.skill_type === 'offered') {
        if (newSkill.years_experience) {
          skillData.years_experience = parseInt(newSkill.years_experience);
        }
      }

      await skillService.updateSkill(editSkill.id, skillData);
      setShowEditModal(false);
      setEditSkill(null);
      showNotification('Skill updated successfully!', 'success');
      loadMySkills();
    } catch (error) {
      showNotification('Failed to update skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await skillService.deleteSkill(skillId);
      setDeleteConfirm(null);
      showNotification('Skill deleted successfully!', 'success');
      loadMySkills();
    } catch (error) {
      showNotification('Failed to delete skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleRequestSession = async () => {
    setLoading(true);
    try {
      await skillService.requestSession({
        mentor_id: selectedMentor.user_id,
        skill_id: selectedMentor.skill_id,
        ...requestData,
      });
      setRequestModal(false);
      showNotification('Session request sent successfully!', 'success');
      setRequestData({ date: '', time: '', duration: 60, message: '' });
    } catch (error) {
      showNotification('Failed to send request: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const loadMySkills = async () => {
    try {
      const data = await skillService.getMySkills();
      setMySkills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading skills:', error);
      setMySkills([]);
    }
  };

  const searchMentors = async () => {
    if (!searchSkill.trim()) return;
    setLoading(true);
    try {
      const data = await skillService.searchSkills(searchSkill, 'offered');
      setMentors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error finding mentors:', error);
      showNotification('Failed to find mentors', 'error');
      setMentors([]);
    }
    setLoading(false);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const loadRecommendations = async () => {
    try {
      const data = await skillService.getRecommendations();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    }
  };

  const handleAddRecommendedSkill = async (skillName) => {
    setLoading(true);
    try {
      await skillService.addRecommendedSkill(skillName);
      showNotification(`${skillName} added to your skills!`, 'success');
      setRecommendations(recommendations.filter((r) => r.skill_name !== skillName));
      await loadMySkills();
    } catch (error) {
      showNotification('Failed to add skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const loadSkillSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await skillService.getSuggestionsForWantToLearn();
      setSkillSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading skill suggestions:', error);
      setSkillSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  const loadMentorLearnerMatches = async () => {
    setLoading(true);
    try {
      const data = await skillService.getMentorLearnerMatches();
      setMentorLearnerMatches(data || { recommended_mentors: [], recommended_learners: [] });
    } catch (error) {
      console.error('Error loading mentor/learner matches:', error);
      setMentorLearnerMatches({ recommended_mentors: [], recommended_learners: [] });
    }
    setLoading(false);
  };

  const handleAddSuggestionAsSkill = async (suggestion) => {
    setLoading(true);
    try {
      await skillService.addSkill({
        skill_name: suggestion.skill_name,
        skill_type: 'wanted',
        skill_level: suggestion.difficulty || 'beginner',
        description: suggestion.description || '',
      });
      showNotification(`${suggestion.skill_name} added to "Want to Learn"!`, 'success');
      setSkillSuggestions(skillSuggestions.filter((s) => s.skill_name !== suggestion.skill_name));
      await loadMySkills();
    } catch (error) {
      showNotification('Failed to add skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'my-skills') {
      loadMySkills();
    } else if (activeTab === 'recommendations') {
      loadRecommendations();
      loadMentorLearnerMatches();
    } else if (activeTab === 'matches') {
      loadMentorLearnerMatches();
    }
  }, [activeTab]);

  useEffect(() => {
    if (showAddSkill && newSkill.skill_type === 'wanted') {
      loadSkillSuggestions();
    }
  }, [showAddSkill, newSkill.skill_type]);

  const getLevelChip = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'intermediate':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'advanced':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'expert':
        return 'bg-coral-100 text-coral-700 dark:bg-coral-900/30 dark:text-coral-400';
      default:
        return 'bg-black/5 text-ink-600 dark:bg-white/10 dark:text-ink-200';
    }
  };

  const getLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return GraduationCap;
      case 'intermediate':
        return TrendingUp;
      case 'advanced':
        return Award;
      case 'expert':
        return Crown;
      default:
        return Target;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'from-coral-400 to-pink-500',
      'from-cyan-400 to-indigo-500',
      'from-emerald-400 to-cyan-500',
      'from-amber-300 to-coral-400',
      'from-indigo-400 to-indigo-600',
      'from-cyan-400 to-cyan-600',
    ];
    const index = (name || '').length % colors.length;
    return colors[index];
  };

  const sortMentors = (mentorsList) => {
    switch (sortBy) {
      case 'rating':
        return [...mentorsList].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case 'sessions':
        return [...mentorsList].sort((a, b) => (b.total_sessions || 0) - (a.total_sessions || 0));
      case 'name':
        return [...mentorsList].sort((a, b) =>
          (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '')
        );
      default:
        return mentorsList;
    }
  };

  const filterMentorsByLevel = (mentorsList) => {
    if (filterLevel === 'all') return mentorsList;
    return mentorsList.filter((m) => m.skill_level?.toLowerCase() === filterLevel);
  };

  const filterMentorsByType = (mentorsList) => {
    if (filterType === 'all') return mentorsList;
    return mentorsList.filter((m) => m.verification_status === (filterType === 'verified'));
  };

  const displayedMentors = filterMentorsByType(filterMentorsByLevel(sortMentors(mentors)));

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="skill-marketplace-page">
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-soft-lg animate-scale-in ${
            notification.type === 'success' ? 'bg-emerald-500' : 'bg-coral-500'
          } text-white flex items-center gap-3`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero header — ink-navy */}
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
                <span className="chip chip-cyan mb-3"><Sparkles className="w-3 h-3" /> skill exchange</span>
                <h1 className="font-display text-5xl md:text-6xl leading-[.95] tracking-tight">
                  Skill <span className="italic text-gradient-cyan">marketplace</span>,<br />
                  <span className="italic text-gradient">your way</span>.
                </h1>
                <p className="mt-3 text-ink-300">Discover, learn, and grow with our community.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10"
                  title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                >
                  {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <GridIcon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => (activeTab === 'my-skills' ? loadMySkills() : searchMentors())}
                  className="btn btn-ghost text-white border-white/15 bg-white/5 hover:bg-white/10"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-black/5 dark:border-white/10" data-testid="skill-tabs">
          {[{ id: 'my-skills', label: 'My Skills', icon: BookOpen }].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id ? 'text-cyan-500' : 'text-ink-500 dark:text-ink-300 hover:text-ink-950 dark:hover:text-white'
                }`}
                data-testid={`${tab.id}-tab`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,#22d3ee,#ff6a5b)' }}></div>
                )}
              </button>
            );
          })}
        </div>

        {/* My Skills Tab */}
        {activeTab === 'my-skills' && (
          <div className="space-y-8">
            {/* Header with Stats */}
            <div className="bento p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="chip chip-cyan mb-2">your skills</span>
                  <h2 className="font-display text-3xl md:text-4xl leading-tight">
                    Manage your <span className="italic text-gradient-cyan">expertise</span>
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-display text-3xl leading-none">{mySkills.length}</p>
                      <p className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">Total</p>
                    </div>
                    <div className="w-px h-10 bg-black/10 dark:bg-white/10"></div>
                    <div className="text-right">
                      <p className="font-display text-3xl leading-none text-emerald-500">
                        {mySkills.filter((s) => s.is_verified).length}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">Verified</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddSkill(true)}
                    className="btn btn-coral"
                    data-testid="add-skill-button"
                  >
                    <Plus className="w-4 h-4" />
                    Add Skill
                  </button>
                </div>
              </div>
            </div>

            {mySkills.length === 0 ? (
              <div className="empty-state" data-testid="no-skills">
                <BookOpen className="w-12 h-12 text-ink-400" />
                <p className="font-display text-3xl">No skills added yet</p>
                <p className="text-sm text-ink-500 max-w-sm">
                  Start by adding your first skill. Showcase what you can teach or what you want to learn!
                </p>
                <button onClick={() => setShowAddSkill(true)} className="btn btn-cyan mt-2">
                  Add your first skill <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Skills I Can Teach */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-white shadow-soft">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="chip chip-cyan mb-1.5">teaching</span>
                      <h3 className="font-display text-3xl md:text-4xl leading-tight">
                        Skills I can <span className="italic text-gradient-cyan">teach</span>
                      </h3>
                      <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
                        {mySkills.filter((s) => s.skill_type === 'offered').length} skill(s) you can mentor in.
                      </p>
                    </div>
                  </div>

                  {mySkills.filter((s) => s.skill_type === 'offered').length === 0 ? (
                    <div className="rounded-[24px] border-2 border-dashed border-emerald-300/50 dark:border-emerald-700/40 bg-emerald-50/50 dark:bg-emerald-900/10 p-10 text-center">
                      <GraduationCap className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                      <p className="text-sm text-ink-500 dark:text-ink-300">
                        No teaching skills yet. Add skills you can mentor others in!
                      </p>
                      <button
                        onClick={() => setShowAddSkill(true)}
                        className="btn btn-ghost mt-3 text-emerald-600 dark:text-emerald-400"
                      >
                        <Plus className="w-3 h-3" /> Add Teaching Skill
                      </button>
                    </div>
                  ) : (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
                      {mySkills.filter((s) => s.skill_type === 'offered').map((skill) => (
                        <div key={skill.id} className="bento bento-glow p-0 overflow-hidden" data-testid="skill-card">
                          <div className="p-6 border-b border-black/5 dark:border-white/10">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-display text-2xl leading-tight truncate">{skill.skill_name}</h3>
                                {skill.description && (
                                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1 line-clamp-2">
                                    {skill.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditSkill(skill);
                                    setShowEditModal(true);
                                  }}
                                  className="w-8 h-8 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10 transition"
                                >
                                  <Edit2 className="w-4 h-4 text-ink-500" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(skill.id)}
                                  className="w-8 h-8 rounded-full grid place-items-center hover:bg-coral-500/10 transition"
                                >
                                  <X className="w-4 h-4 text-ink-500 hover:text-coral-500" />
                                </button>
                              </div>
                            </div>

                            {deleteConfirm === skill.id && (
                              <div className="mt-3 p-3 rounded-2xl bg-coral-500/10 border border-coral-300/30">
                                <p className="text-sm text-coral-600 mb-2">Delete this skill?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    className="btn btn-coral px-3 py-1 text-xs"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="btn btn-ghost px-3 py-1 text-xs"
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-4">
                              <span className="chip chip-cyan">Can Teach</span>
                              <span className={`chip ${getLevelChip(skill.skill_level)}`}>
                                {skill.skill_level || 'Not specified'}
                              </span>
                              {skill.is_verified && (
                                <span className="chip chip-cyan bg-emerald-100 text-emerald-700">
                                  <Shield className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-6 space-y-3">
                            <div className="flex justify-between text-sm text-ink-500 dark:text-ink-300">
                              {skill.years_experience && <span>{skill.years_experience} yrs experience</span>}
                            </div>

                            <div className="flex justify-between text-sm pt-3 border-t border-black/5 dark:border-white/10">
                              <div className="flex items-center gap-1 text-ink-600 dark:text-ink-200">
                                <Users className="w-4 h-4" />
                                {skill.student_count || 0}
                              </div>
                              <div className="flex items-center gap-1 text-ink-600 dark:text-ink-200">
                                <Star className="w-4 h-4 text-amber-400 fill-current" />
                                {skill.average_rating?.toFixed(1) || '0.0'}
                              </div>
                            </div>
                          </div>

                          {!skill.is_verified && (
                            <div className="px-6 pb-6">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSkillQuizModal({
                                    show: true,
                                    skill: skill.skill_name,
                                    level: skill.skill_level,
                                  });
                                }}
                                className="btn btn-cyan w-full"
                                data-testid="verify-skill-button"
                              >
                                Take Skill Assessment
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills I Want to Learn */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white shadow-soft">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="chip chip-coral mb-1.5">learning</span>
                      <h3 className="font-display text-3xl md:text-4xl leading-tight">
                        Skills I want to <span className="italic text-gradient">learn</span>
                      </h3>
                      <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
                        {mySkills.filter((s) => s.skill_type === 'wanted').length} skill(s) you're learning.
                      </p>
                    </div>
                  </div>

                  {mySkills.filter((s) => s.skill_type === 'wanted').length === 0 ? (
                    <div className="rounded-[24px] border-2 border-dashed border-cyan-300/50 dark:border-cyan-700/40 bg-cyan-50/50 dark:bg-cyan-900/10 p-10 text-center">
                      <BookOpen className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                      <p className="text-sm text-ink-500 dark:text-ink-300">No learning goals yet. Add skills you want to master!</p>
                      <button onClick={() => setShowAddSkill(true)} className="btn btn-ghost mt-3 text-cyan-600 dark:text-cyan-400">
                        <Plus className="w-3 h-3" /> Add Learning Goal
                      </button>
                    </div>
                  ) : (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
                      {mySkills.filter((s) => s.skill_type === 'wanted').map((skill) => (
                        <div key={skill.id} className="bento bento-glow p-0 overflow-hidden" data-testid="skill-card">
                          <div className="p-6 border-b border-black/5 dark:border-white/10">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-display text-2xl leading-tight truncate">{skill.skill_name}</h3>
                                {skill.description && (
                                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1 line-clamp-2">{skill.description}</p>
                                )}
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditSkill(skill);
                                    setShowEditModal(true);
                                  }}
                                  className="w-8 h-8 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10 transition"
                                >
                                  <Edit2 className="w-4 h-4 text-ink-500" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(skill.id)}
                                  className="w-8 h-8 rounded-full grid place-items-center hover:bg-coral-500/10 transition"
                                >
                                  <X className="w-4 h-4 text-ink-500 hover:text-coral-500" />
                                </button>
                              </div>
                            </div>

                            {deleteConfirm === skill.id && (
                              <div className="mt-3 p-3 rounded-2xl bg-coral-500/10 border border-coral-300/30">
                                <p className="text-sm text-coral-600 mb-2">Delete this skill?</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDeleteSkill(skill.id)} className="btn btn-coral px-3 py-1 text-xs">
                                    Yes
                                  </button>
                                  <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost px-3 py-1 text-xs">
                                    No
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-4">
                              <span className="chip chip-coral">Want to Learn</span>
                              <span className={`chip ${getLevelChip(skill.skill_level)}`}>
                                {skill.skill_level || 'Beginner'}
                              </span>
                            </div>
                          </div>

                          <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-ink-500 dark:text-ink-300">
                                Target Level:{' '}
                                <span className="font-semibold text-ink-950 dark:text-white capitalize">
                                  {skill.skill_level || 'Beginner'}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="px-6 pb-6">
                            <button
                              onClick={() => setFindMentorModal({ show: true, skill: skill.skill_name })}
                              className="btn btn-cyan w-full"
                            >
                              <Search className="w-4 h-4" />
                              Find Mentor
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-10">
            {/* Recommended Mentors */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-white shadow-soft">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="chip chip-cyan mb-1.5">mentors</span>
                  <h3 className="font-display text-3xl md:text-4xl leading-tight">
                    Recommended <span className="italic text-gradient-cyan">mentors</span>
                  </h3>
                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
                    People who can teach what you want to learn ({mentorLearnerMatches.recommended_mentors?.length || 0})
                  </p>
                </div>
              </div>

              {(!mentorLearnerMatches.recommended_mentors || mentorLearnerMatches.recommended_mentors.length === 0) ? (
                <div className="rounded-[24px] border-2 border-dashed border-emerald-300/50 dark:border-emerald-700/40 bg-emerald-50/50 dark:bg-emerald-900/10 p-10 text-center">
                  <Users className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-ink-500 dark:text-ink-300">
                    No mentor matches yet. Add skills you want to learn to get personalized mentor recommendations!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mentorLearnerMatches.recommended_mentors.map((mentor) => (
                    <div
                      key={mentor.user_id}
                      className="bento bento-glow p-0 overflow-hidden cursor-pointer"
                      data-testid="mentor-card"
                      onClick={() => {
                        setSelectedMentorDetail(mentor);
                        setShowMentorDetailModal(true);
                      }}
                    >
                      <div className="relative h-24 bg-ink-950 overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-70"
                          style={{
                            background:
                              'radial-gradient(400px 240px at 0% 0%, rgba(16,185,129,.45), transparent 60%), radial-gradient(400px 240px at 100% 100%, rgba(34,211,238,.35), transparent 60%)',
                          }}
                        />
                        {mentor.background_photo && (
                          <img src={mentor.background_photo} alt="cover" className="w-full h-full object-cover absolute inset-0 opacity-70" />
                        )}
                        <div className="absolute -bottom-10 left-6 z-10">
                          {mentor.profile_photo ? (
                            <img
                              src={mentor.profile_photo}
                              alt={mentor.full_name || mentor.username}
                              className="w-20 h-20 rounded-full object-cover shadow-soft-lg ring-4 ring-white dark:ring-gray-900"
                            />
                          ) : (
                            <div
                              className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                                mentor.full_name || mentor.username
                              )} flex items-center justify-center text-white text-2xl font-bold shadow-soft-lg ring-4 ring-white dark:ring-gray-900`}
                            >
                              {getInitials(mentor.full_name || mentor.username)}
                            </div>
                          )}
                        </div>
                        {mentor.is_available && (
                          <span className="absolute top-3 right-3 chip chip-cyan bg-emerald-500/90 text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Online
                          </span>
                        )}
                      </div>

                      <div className="pt-14 p-6 space-y-4">
                        <div>
                          <h4 className="font-display text-xl leading-tight">{mentor.full_name || mentor.username}</h4>
                          {mentor.bio && (
                            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1 line-clamp-2">{mentor.bio}</p>
                          )}
                        </div>

                        {mentor.matching_skills && mentor.matching_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {mentor.matching_skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="chip chip-cyan bg-emerald-100 text-emerald-700">
                                {skill}
                              </span>
                            ))}
                            {mentor.matching_skills.length > 3 && (
                              <span className="chip chip-ink">+{mentor.matching_skills.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10">
                          <div className="flex items-center gap-1 text-sm text-ink-500 dark:text-ink-300">
                            <Briefcase className="w-4 h-4" />
                            <span>{mentor.total_sessions || 0} sessions</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMentorDetail(mentor);
                              setShowMentorDetailModal(true);
                            }}
                            className="btn btn-cyan flex-1"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showNotification('Connection request sent!', 'success');
                            }}
                            className="btn btn-ghost"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Learners */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white shadow-soft">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="chip chip-coral mb-1.5">learners</span>
                  <h3 className="font-display text-3xl md:text-4xl leading-tight">
                    Recommended <span className="italic text-gradient">learners</span>
                  </h3>
                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
                    People who want to learn what you can teach ({mentorLearnerMatches.recommended_learners?.length || 0})
                  </p>
                </div>
              </div>

              {(!mentorLearnerMatches.recommended_learners || mentorLearnerMatches.recommended_learners.length === 0) ? (
                <div className="rounded-[24px] border-2 border-dashed border-cyan-300/50 dark:border-cyan-700/40 bg-cyan-50/50 dark:bg-cyan-900/10 p-10 text-center">
                  <Users className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                  <p className="text-sm text-ink-500 dark:text-ink-300">
                    No learner matches yet. Add skills you can teach to get personalized learner recommendations!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mentorLearnerMatches.recommended_learners.map((learner) => (
                    <div
                      key={learner.user_id}
                      className="bento bento-glow p-0 overflow-hidden cursor-pointer"
                      data-testid="learner-card"
                      onClick={() => {
                        setSelectedMentorDetail(learner);
                        setShowMentorDetailModal(true);
                      }}
                    >
                      <div className="relative h-24 bg-ink-950 overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-70"
                          style={{
                            background:
                              'radial-gradient(400px 240px at 0% 0%, rgba(34,211,238,.45), transparent 60%), radial-gradient(400px 240px at 100% 100%, rgba(99,102,241,.4), transparent 60%)',
                          }}
                        />
                        {learner.background_photo && (
                          <img src={learner.background_photo} alt="cover" className="w-full h-full object-cover absolute inset-0 opacity-70" />
                        )}
                        <div className="absolute -bottom-10 left-6 z-10">
                          {learner.profile_photo ? (
                            <img
                              src={learner.profile_photo}
                              alt={learner.full_name || learner.username}
                              className="w-20 h-20 rounded-full object-cover shadow-soft-lg ring-4 ring-white dark:ring-gray-900"
                            />
                          ) : (
                            <div
                              className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                                learner.full_name || learner.username
                              )} flex items-center justify-center text-white text-2xl font-bold shadow-soft-lg ring-4 ring-white dark:ring-gray-900`}
                            >
                              {getInitials(learner.full_name || learner.username)}
                            </div>
                          )}
                        </div>
                        {learner.is_available && (
                          <span className="absolute top-3 right-3 chip chip-cyan bg-emerald-500/90 text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Online
                          </span>
                        )}
                      </div>

                      <div className="pt-14 p-6 space-y-4">
                        <div>
                          <h4 className="font-display text-xl leading-tight">{learner.full_name || learner.username}</h4>
                          {learner.bio && (
                            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1 line-clamp-2">{learner.bio}</p>
                          )}
                        </div>

                        {learner.matching_skills && learner.matching_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {learner.matching_skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="chip chip-cyan">{skill}</span>
                            ))}
                            {learner.matching_skills.length > 3 && (
                              <span className="chip chip-ink">+{learner.matching_skills.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10">
                          <div className="flex items-center gap-1 text-sm text-ink-500 dark:text-ink-300">
                            <BookOpen className="w-4 h-4" />
                            <span>Learning {learner.matching_skills?.length || 0} skill(s)</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMentorDetail(learner);
                              setShowMentorDetailModal(true);
                            }}
                            className="btn btn-cyan flex-1"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showNotification('Connection request sent!', 'success');
                            }}
                            className="btn btn-ghost"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Find Mentors Tab */}
        {activeTab === 'find-mentors' && (
          <div className="space-y-6">
            <div className="bento p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search for a skill (e.g., React, Python, Design)..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    value={searchSkill}
                    onChange={(e) => setSearchSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchMentors()}
                    data-testid="search-skill-input"
                  />
                </div>
                <button
                  onClick={searchMentors}
                  disabled={loading}
                  className="btn btn-coral px-6"
                  data-testid="search-mentors-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find Mentors
                    </>
                  )}
                </button>
              </div>

              {mentors.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/10">
                  <span className="text-xs uppercase tracking-widest text-ink-500 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filter:
                  </span>

                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Mentors</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs outline-none focus:border-cyan-400"
                  >
                    <option value="rating">Sort by Rating</option>
                    <option value="sessions">Sort by Sessions</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
              )}
            </div>

            {mentors.length === 0 ? (
              <div className="empty-state" data-testid="no-mentors">
                <Search className="w-12 h-12 text-ink-400" />
                <p className="font-display text-3xl">Find your mentor</p>
                <p className="text-sm text-ink-500 max-w-sm">
                  Enter a skill above to discover expert mentors ready to guide you.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {['React', 'Python', 'Design', 'Marketing'].map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        setSearchSkill(skill);
                        searchMentors();
                      }}
                      className="chip chip-ink hover:bg-cyan-500/10 transition"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
                {displayedMentors.map((mentor) => {
                  const LevelIcon = getLevelIcon(mentor.skill_level);
                  return (
                    <div key={mentor.user_id} className="bento bento-glow p-0 overflow-hidden" data-testid="mentor-card">
                      <div className="relative h-24 bg-ink-950 overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-70"
                          style={{
                            background:
                              'radial-gradient(400px 240px at 0% 0%, rgba(34,211,238,.45), transparent 60%), radial-gradient(400px 240px at 100% 100%, rgba(255,106,91,.35), transparent 60%)',
                          }}
                        />
                        {mentor.background_photo && (
                          <img src={mentor.background_photo} alt="cover" className="w-full h-full object-cover absolute inset-0 opacity-70" />
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          {mentor.is_verified && (
                            <span className="chip chip-cyan bg-emerald-500/90 text-white">
                              <Shield className="w-3 h-3" /> Verified
                            </span>
                          )}
                          {mentor.is_available && (
                            <span className="chip chip-cyan bg-emerald-500/90 text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Online
                            </span>
                          )}
                        </div>

                        <div className="absolute -bottom-10 left-6 z-10">
                          {mentor.profile_photo ? (
                            <img
                              src={mentor.profile_photo}
                              alt={mentor.full_name || mentor.username}
                              className="w-20 h-20 rounded-full object-cover shadow-soft-lg ring-4 ring-white dark:ring-gray-900"
                            />
                          ) : (
                            <div
                              className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                                mentor.full_name || mentor.username
                              )} flex items-center justify-center text-white text-2xl font-bold shadow-soft-lg ring-4 ring-white dark:ring-gray-900`}
                            >
                              {getInitials(mentor.full_name || mentor.username)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-14 p-6 space-y-4">
                        <div>
                          <h3 className="font-display text-xl leading-tight">{mentor.full_name || mentor.username}</h3>
                          {mentor.bio && (
                            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1 line-clamp-2">{mentor.bio}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs uppercase tracking-widest text-ink-500">Teaching</span>
                          <span className="chip chip-cyan">{mentor.skill_name}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`chip ${getLevelChip(mentor.skill_level)}`}>
                            <LevelIcon className="w-3 h-3" />
                            <span className="capitalize">{mentor.skill_level || 'Intermediate'}</span>
                          </span>
                          {mentor.years_experience && (
                            <span className="text-xs text-ink-500 dark:text-ink-300">{mentor.years_experience}+ yrs exp</span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="font-display text-lg leading-none">
                                {mentor.average_rating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">Rating</p>
                          </div>
                          <div className="text-center border-x border-black/10 dark:border-white/10">
                            <div className="font-display text-lg leading-none">{mentor.total_sessions || 0}</div>
                            <p className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">Sessions</p>
                          </div>
                          <div className="text-center">
                            <div className="font-display text-lg leading-none">{mentor.total_students || 0}</div>
                            <p className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">Students</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => {
                              setSelectedMentorDetail(mentor);
                              setShowMentorDetailModal(true);
                            }}
                            className="btn btn-cyan flex-1"
                            data-testid="view-profile-button"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMentor(mentor);
                              setRequestModal(true);
                            }}
                            className="btn btn-ghost"
                            data-testid="book-session-button"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Skill Modal */}
        {showAddSkill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddSkill(false)} data-testid="add-skill-modal">
            <div className="bento p-0 max-w-md w-full bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden bg-ink-950 text-white p-6 rounded-t-[28px]">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      'radial-gradient(400px 240px at 10% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 240px at 100% 110%, rgba(255,106,91,.22), transparent 60%)',
                  }}
                />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-2">new skill</span>
                    <h2 className="font-display text-3xl">Add a skill</h2>
                  </div>
                  <button
                    onClick={() => setShowAddSkill(false)}
                    className="w-9 h-9 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddSkill} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Skill Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    placeholder="e.g., JavaScript, Photography"
                    value={newSkill.skill_name}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                    data-testid="skill-name-input"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    placeholder="Brief description of your skill..."
                    rows="3"
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['offered', 'wanted'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewSkill({ ...newSkill, skill_type: type })}
                        className={`px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                          newSkill.skill_type === type
                            ? type === 'offered'
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
                            : 'border-black/10 dark:border-white/10 text-ink-500 dark:text-ink-300'
                        }`}
                      >
                        {type === 'offered' ? 'Can Teach' : 'Want to Learn'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Skill Level</label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    value={newSkill.skill_level}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_level: e.target.value })}
                    data-testid="skill-level-select"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                {newSkill.skill_type === 'offered' && (
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Years Experience</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                      placeholder="e.g., 5"
                      value={newSkill.years_experience}
                      onChange={(e) => setNewSkill({ ...newSkill, years_experience: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddSkill(false)} className="btn btn-ghost flex-1" data-testid="cancel-button">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-coral flex-1" data-testid="submit-skill-button">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Skill
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Skill Modal */}
        {showEditModal && editSkill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
            <div className="bento p-0 max-w-md w-full bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden bg-ink-950 text-white p-6 rounded-t-[28px]">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      'radial-gradient(400px 240px at 10% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 240px at 100% 110%, rgba(255,106,91,.22), transparent 60%)',
                  }}
                />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-2">edit</span>
                    <h2 className="font-display text-3xl">Edit skill</h2>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-9 h-9 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditSkill} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Skill Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    value={editSkill.skill_name}
                    onChange={(e) => setEditSkill({ ...editSkill, skill_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    rows="3"
                    value={editSkill.description || ''}
                    onChange={(e) => setEditSkill({ ...editSkill, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['offered', 'wanted'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditSkill({ ...editSkill, skill_type: type })}
                        className={`px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                          editSkill.skill_type === type
                            ? type === 'offered'
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
                            : 'border-black/10 dark:border-white/10 text-ink-500 dark:text-ink-300'
                        }`}
                      >
                        {type === 'offered' ? 'Can Teach' : 'Want to Learn'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Skill Level</label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    value={editSkill.skill_level}
                    onChange={(e) => setEditSkill({ ...editSkill, skill_level: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                {editSkill.skill_type === 'offered' && (
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Years Experience</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                      value={editSkill.years_experience || ''}
                      onChange={(e) => setEditSkill({ ...editSkill, years_experience: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-cyan flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Update Skill
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Session Request Modal */}
        {requestModal && selectedMentor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRequestModal(false)}>
            <div className="bento p-0 max-w-md w-full bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden bg-ink-950 text-white p-6 rounded-t-[28px]">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      'radial-gradient(400px 240px at 10% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 240px at 100% 110%, rgba(255,106,91,.22), transparent 60%)',
                  }}
                />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-2">request</span>
                    <h2 className="font-display text-3xl">Request session</h2>
                    <p className="text-ink-300 text-sm mt-1">with {selectedMentor.full_name || selectedMentor.username}</p>
                  </div>
                  <button
                    onClick={() => setRequestModal(false)}
                    className="w-9 h-9 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Skill</label>
                  <div className="px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5">
                    {selectedMentor.skill_name} ({selectedMentor.skill_level})
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Select Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    value={requestData.date}
                    onChange={(e) => setRequestData({ ...requestData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Select Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    value={requestData.time}
                    onChange={(e) => setRequestData({ ...requestData, time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Duration (minutes)</label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    value={requestData.duration}
                    onChange={(e) => setRequestData({ ...requestData, duration: parseInt(e.target.value) })}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-500 mb-2">Message (Optional)</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-sm outline-none focus:border-cyan-400 focus:shadow-glow transition"
                    rows="3"
                    placeholder="What would you like to learn? Any specific topics?"
                    value={requestData.message}
                    onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                  ></textarea>
                </div>

                <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                    This session is completely free!
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setRequestModal(false)} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestSession}
                    disabled={loading || !requestData.date || !requestData.time}
                    className="btn btn-coral flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FindMentorModal
        isOpen={findMentorModal.show}
        onClose={() => setFindMentorModal({ show: false, skill: '' })}
        skillName={findMentorModal.skill}
      />

      <SkillQuizModal
        isOpen={skillQuizModal.show}
        onClose={() => setSkillQuizModal({ show: false, skill: '', level: 'intermediate' })}
        skillName={skillQuizModal.skill}
        skillLevel={skillQuizModal.level}
        onSuccess={() => {
          showNotification('Skill verified successfully!', 'success');
          loadMySkills();
        }}
      />

      {showMentorDetailModal && selectedMentorDetail && (
        <MentorDetailModal
          isOpen={showMentorDetailModal}
          onClose={() => {
            setShowMentorDetailModal(false);
            setSelectedMentorDetail(null);
          }}
          mentor={selectedMentorDetail}
        />
      )}
    </div>
  );
};

export default SkillMarketplace;
