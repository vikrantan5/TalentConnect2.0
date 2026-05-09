import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { taskService, paymentService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import RealtimeChat from '../components/RealtimeChat';
import PaymentModal from '../components/PaymentModal';
import FileUploadZone from '../components/FileUploadZone';
import TaskApplicantsModal from '../components/TaskApplicantsModal';
import TaskCancelModal from '../components/TaskCancelModal';
import ReportModal from '../components/ReportModal';
import { uploadMultipleFiles } from '../services/fileUploadService';
import {
  Briefcase,
  Plus,
  X,
  Search,
  Filter,
  Clock,
  DollarSign,
  BookOpen,
  TrendingUp,
  Award,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight,
  MoreVertical,
  ThumbsUp,
  Share2,
  Download,
  RefreshCw,
  Star,
  MapPin,
  User,
  Video,
  FileText,
  Upload,
  Download as DownloadIcon,
  Eye,
  Edit,
  Trash2,
  Send,
  Copy,
  Check,
  Sparkles,
  Zap,
  Shield,
  Crown,
  Medal,
  Target,
  Brain,
  Rocket,
  Compass,
  Grid,
  List,
  Wallet,
  Paperclip,
  XCircle,
  Flag,
  ArrowRight,
} from 'lucide-react';

const TaskMarketplace = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'medium',
    price: '',
    deadline: '',
    attachments: [],
    attachmentFiles: [],
    requirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [submissionModal, setSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    message: '',
    attachments: [],
    attachmentFiles: [],
  });

  const [viewSubmissionsModal, setViewSubmissionsModal] = useState(false);
  const [taskSubmissions, setTaskSubmissions] = useState([]);

  const [showChat, setShowChat] = useState(false);
  const [chatTask, setChatTask] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTask, setPaymentTask] = useState(null);
  const [showApplicants, setShowApplicants] = useState(false);
  const [applicantsTask, setApplicantsTask] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTask, setCancelTask] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUser, setReportUser] = useState(null);
  const [reportTask, setReportTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'all') {
        data = await taskService.getAllTasks('open');
      } else if (activeTab === 'my-tasks') {
        data = await taskService.getMyTasks();
      } else if (activeTab === 'accepted') {
        data = await taskService.getAcceptedTasks();
      } else if (activeTab === 'completed') {
        data = await taskService.getCompletedTasks();
      } else {
        data = await taskService.getAllTasks(activeTab);
      }
      let processedTasks = [];
      if (Array.isArray(data)) {
        processedTasks = data.map((item) => {
          if (item.task) {
            const userName =
              activeTab === 'my-tasks'
                ? item.acceptor?.full_name || item.acceptor?.username
                : item.creator?.full_name || item.creator?.username;

            const userPhoto =
              activeTab === 'my-tasks' ? item.acceptor?.profile_photo : item.creator?.profile_photo;

            const userRating =
              activeTab === 'my-tasks' ? item.acceptor?.average_rating : item.creator?.average_rating;

            return {
              ...item.task,
              creator_name: userName,
              creator_photo: userPhoto,
              creator_rating: userRating,
            };
          }
          return item;
        });
      }

      setTasks(processedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showNotification('Failed to load tasks', 'error');
      setTasks([]);
    }
    setLoading(false);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleOpenChat = (task) => {
    setChatTask(task);
    setShowChat(true);
  };

  const handleOpenPayment = (task) => {
    setPaymentTask(task);
    setShowPayment(true);
  };

  const handleOpenApplicants = (task) => {
    setApplicantsTask(task);
    setShowApplicants(true);
  };

  const handleApplicantAssigned = () => {
    showNotification('Task assigned successfully!', 'success');
    loadTasks();
    setShowApplicants(false);
  };

  const handlePaymentSuccess = () => {
    showNotification('Payment successful! Your task is now published.', 'success');
    setPaymentModal(false);
    setPaymentTask(null);
    loadTasks();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (newTask.title.length < 10) {
      showNotification('Task title must be at least 10 characters long', 'error');
      return;
    }

    if (newTask.title.length > 500) {
      showNotification('Task title cannot exceed 500 characters', 'error');
      return;
    }

    if (!newTask.description || newTask.description.trim().length === 0) {
      showNotification('Task description is required', 'error');
      return;
    }

    if (!newTask.price || parseFloat(newTask.price) <= 0) {
      showNotification('Task price must be greater than 0', 'error');
      return;
    }

    if (!newTask.deadline) {
      showNotification('Task deadline is required', 'error');
      return;
    }

    setLoading(true);
    try {
      let uploadedFileUrls = [];
      if (newTask.attachmentFiles && newTask.attachmentFiles.length > 0) {
        try {
          const uploadResults = await uploadMultipleFiles(newTask.attachmentFiles, 'task-attachments', 'task-files');
          uploadedFileUrls = uploadResults.map((result) => result.url);
          showNotification('Files uploaded successfully!', 'success');
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          showNotification('Failed to upload files: ' + uploadError.message, 'error');
          setLoading(false);
          return;
        }
      }
      const taskDataToSubmit = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        subject: newTask.subject || null,
        difficulty_level: newTask.difficulty_level || null,
        price: parseFloat(newTask.price),
        deadline: new Date(newTask.deadline).toISOString(),
        attachment_urls: uploadedFileUrls,
        requirements: newTask.requirements || null,
      };
      console.log('Submitting task data:', taskDataToSubmit);

      const result = await taskService.createTask(taskDataToSubmit);
      showNotification('Task created successfully! Please make payment to publish.', 'success');
      setShowCreateTask(false);

      if (result && result.task) {
        setPaymentTask(result.task);
        setPaymentModal(true);
      }

      setNewTask({
        title: '',
        description: '',
        subject: '',
        difficulty_level: 'medium',
        price: '',
        deadline: '',
        attachments: [],
        attachmentFiles: [],
        requirements: '',
      });
      loadTasks();
    } catch (error) {
      console.error('Task creation error:', error.response?.data);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';

      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        const validationErrors = error.response.data.detail
          .map((err) => `${err.loc?.join('.')}: ${err.msg}`)
          .join(', ');
        showNotification('Validation error: ' + validationErrors, 'error');
      } else {
        showNotification('Failed to create task: ' + errorMessage, 'error');
      }
    }
    setLoading(false);
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await taskService.acceptTask(taskId);
      showNotification('Task accepted! You can now work on it.', 'success');
      loadTasks();
    } catch (error) {
      showNotification('Failed to accept task: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const handleSubmitTask = async () => {
    setLoading(true);
    try {
      let uploadedFileUrls = [];
      if (submissionData.attachmentFiles && submissionData.attachmentFiles.length > 0) {
        try {
          const uploadResults = await uploadMultipleFiles(
            submissionData.attachmentFiles,
            'task-attachments',
            'submission-files'
          );
          uploadedFileUrls = uploadResults.map((result) => result.url);
          showNotification('Files uploaded successfully!', 'success');
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          showNotification('Failed to upload files: ' + uploadError.message, 'error');
          setLoading(false);
          return;
        }
      }

      const result = await taskService.submitTask(selectedTask.id, {
        message: submissionData.message,
        attachments: uploadedFileUrls,
      });

      const plagiarismScore = result?.plagiarism_report?.similarity_score || 0;

      if (result?.plagiarism_report?.flagged) {
        showNotification(`Task submitted but flagged for review (${plagiarismScore}% similarity)`, 'error');
      } else {
        showNotification('Task submitted successfully!', 'success');
      }

      setSubmissionModal(false);
      setSubmissionData({ message: '', attachments: [], attachmentFiles: [] });
      loadTasks();
    } catch (error) {
      showNotification('Failed to submit task: ' + (error.response?.data?.detail || error.message), 'error');
    }

    setLoading(false);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await taskService.approveSubmission(taskId, 'Approved by task creator');
      showNotification('Submission approved and payment released!', 'success');
      loadTasks();
    } catch (error) {
      showNotification('Failed to approve task: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleViewSubmissions = async (task) => {
    try {
      setSelectedTask(task);
      const submissions = await taskService.getTaskSubmissions(task.id);
      setTaskSubmissions(submissions);
      setViewSubmissionsModal(true);
    } catch (error) {
      showNotification('Failed to load submissions: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayEscrow = async () => {
    if (!paymentTask) return;
    setPaymentLoading(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        showNotification('Failed to load Razorpay checkout', 'error');
        return;
      }

      const keyResponse = await paymentService.getRazorpayKey();
      const order = await paymentService.createOrder(paymentTask.id, paymentTask.price, paymentTask.currency || 'INR');

      const options = {
        key: keyResponse.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'TalentConnect',
        description: `Escrow for ${paymentTask.title}`,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            showNotification('Payment completed successfully! Your task is now published.', 'success');
            setPaymentModal(false);
            setPaymentTask(null);
            loadTasks();
          } catch (error) {
            showNotification('Payment verification failed', 'error');
          }
        },
        prefill: {
          name: user?.full_name || user?.username || 'TalentConnect User',
          email: user?.email || '',
        },
        theme: { color: '#22d3ee' },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.open();
    } catch (error) {
      showNotification(error?.response?.data?.detail || 'Unable to start payment flow', 'error');
    }
    setPaymentLoading(false);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        showNotification('Task deleted successfully!', 'success');
        loadTasks();
      } catch (error) {
        showNotification('Failed to delete task: ' + (error.response?.data?.detail || error.message), 'error');
      }
    }
  };

  // Difficulty pill — uses chip system
  const getDifficultyPill = (level) => {
    switch ((level || '').toLowerCase()) {
      case 'easy':
        return 'chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20';
      case 'medium':
        return 'chip chip-cyan';
      case 'hard':
        return 'chip chip-coral';
      default:
        return 'chip chip-ink';
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'chip bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20';
      case 'open':
        return 'chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20';
      case 'accepted':
        return 'chip chip-cyan';
      case 'in_progress':
        return 'chip bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/20';
      case 'submitted':
        return 'chip bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20';
      case 'completed':
        return 'chip chip-coral';
      default:
        return 'chip chip-ink';
    }
  };

  const getStatusAccent = (status) => {
    switch (status) {
      case 'open':
        return 'from-emerald-400 to-cyan-500';
      case 'accepted':
        return 'from-cyan-400 to-indigo-500';
      case 'in_progress':
        return 'from-indigo-400 to-coral-400';
      case 'submitted':
        return 'from-amber-400 to-coral-400';
      case 'completed':
        return 'from-coral-400 to-pink-500';
      case 'pending_payment':
        return 'from-amber-400 to-orange-500';
      default:
        return 'from-ink-400 to-ink-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return Target;
      case 'accepted':
        return CheckCircle;
      case 'in_progress':
        return TrendingUp;
      case 'submitted':
        return Send;
      case 'completed':
        return Award;
      default:
        return Briefcase;
    }
  };

  const filterTasks = (tasksList) => {
    let filtered = [...tasksList];

    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter((task) => task.difficulty_level === filterDifficulty);
    }

    if (filterPrice !== 'all') {
      switch (filterPrice) {
        case 'low':
          filtered = filtered.filter((task) => task.price < 500);
          break;
        case 'medium':
          filtered = filtered.filter((task) => task.price >= 500 && task.price < 1000);
          break;
        case 'high':
          filtered = filtered.filter((task) => task.price >= 1000);
          break;
      }
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'deadline':
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
    }

    return filtered;
  };

  const displayedTasks = filterTasks(tasks);

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === 'open').length,
    accepted: tasks.filter((t) => t.status === 'accepted' || t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    totalEarnings: tasks.filter((t) => t.status === 'completed').reduce((sum, t) => sum + (t.price || 0), 0),
  };

  const inputClass =
    'w-full px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur text-ink-950 dark:text-white placeholder:text-ink-400 focus:outline-none focus:border-cyan-400 focus:shadow-glow transition';

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="task-marketplace-page">
      <Navbar />

      {/* Decorative blobs matching Landing/Dashboard aesthetic */}
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-48 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[380px] h-[380px] left-[40%] bottom-[-8rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-9s' }} />

      {/* Notification toast */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[60] glass-strong rounded-2xl px-5 py-4 shadow-soft-lg flex items-center gap-3 animate-scale-in border ${
          notification.type === 'success' ? 'border-emerald-400/40' : 'border-coral-400/40'
        }`}>
          <span className={`w-9 h-9 rounded-xl grid place-items-center text-white shadow-soft ${
            notification.type === 'success' ? 'bg-gradient-to-br from-emerald-400 to-cyan-500' : 'bg-gradient-to-br from-coral-400 to-pink-500'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </span>
          <p className="text-sm font-medium text-ink-950 dark:text-white pr-2">{notification.message}</p>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero banner */}
        <div className="relative mb-10 animate-scale-in">
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
                <span className="chip chip-cyan mb-4">
                  <Briefcase className="w-3 h-3" /> task marketplace
                </span>
                <h1 className="font-display text-5xl md:text-6xl leading-[1] tracking-tight">
                  Find work.
                  <br />
                  Get help.{' '}
                  <span className="italic text-gradient">Earn together.</span>
                </h1>
                <p className="mt-5 max-w-xl text-ink-300 text-base md:text-lg leading-relaxed">
                  Post a task or pick one up. Escrow keeps payments safe — your skills do the rest.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="btn btn-coral px-6 py-3"
                    data-testid="create-task-button"
                  >
                    <Plus className="w-4 h-4" /> Create task
                  </button>
                  <button
                    onClick={loadTasks}
                    className="btn btn-ghost px-5 py-3 text-white border-white/20 hover:bg-white/10"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="btn btn-ghost px-5 py-3 text-white border-white/20 hover:bg-white/10"
                    title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                  >
                    {viewMode === 'grid' ? <><List className="w-4 h-4" /> List</> : <><Grid className="w-4 h-4" /> Grid</>}
                  </button>
                </div>
              </div>

              {/* Quick metric card */}
              <div className="hidden lg:block max-w-xs w-full">
                <div className="relative glass rounded-[24px] p-6 bg-white/5 border-white/10">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs uppercase tracking-widest">
                    <Zap className="w-3.5 h-3.5" /> live
                  </div>
                  <p className="font-display text-5xl mt-2 leading-none">{stats.open}</p>
                  <p className="mt-2 text-sm text-ink-300">open tasks waiting for talent like you</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="chip chip-coral"><Sparkles className="w-3 h-3" /> earn ₹{stats.totalEarnings || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-10">
          {[
            { icon: Briefcase, label: 'Total Tasks', value: stats.total, iconBg: 'from-cyan-400 to-cyan-600' },
            { icon: Target, label: 'Open Tasks', value: stats.open, iconBg: 'from-emerald-400 to-cyan-500' },
            { icon: TrendingUp, label: 'In Progress', value: stats.accepted, iconBg: 'from-indigo-400 to-indigo-600' },
            { icon: DollarSign, label: 'Total Earned', value: `₹${stats.totalEarnings}`, iconBg: 'from-coral-400 to-pink-500' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bento bento-glow p-6 animate-scale-in"
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.iconBg} text-white grid place-items-center shadow-soft`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">{stat.label}</p>
                <p className="font-display text-4xl md:text-5xl mt-1 leading-none">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bento p-2 mb-6 flex flex-wrap items-center gap-1.5" data-testid="task-tabs">
          {[
            { id: 'all', label: 'All Tasks', icon: Briefcase },
            { id: 'my-tasks', label: 'My Tasks', icon: User },
            { id: 'accepted', label: 'Accepted', icon: CheckCircle },
            { id: 'completed', label: 'Completed', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-ink-950 text-white shadow-soft dark:bg-white dark:text-ink-950'
                    : 'text-ink-600 dark:text-ink-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                data-testid={`${tab.id}-tasks-tab`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="bento p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or subject…"
                className={`${inputClass} pl-12`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className={inputClass}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className={inputClass}
              >
                <option value="all">All Prices</option>
                <option value="low">Under ₹500</option>
                <option value="medium">₹500 — ₹1000</option>
                <option value="high">Above ₹1000</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={inputClass}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-high">Price: High → Low</option>
                <option value="price-low">Price: Low → High</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="tc-spinner" />
            <p className="font-display text-xl text-ink-600 dark:text-ink-200">Loading tasks…</p>
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="bento p-16 text-center" data-testid="no-tasks">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center shadow-soft">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-display text-3xl mt-6">
              No tasks <span className="italic text-gradient-cyan">found</span>
            </h3>
            <p className="mt-3 text-ink-500 dark:text-ink-300 max-w-md mx-auto">
              {searchTerm || filterDifficulty !== 'all' || filterPrice !== 'all'
                ? "No tasks match your filters. Try adjusting your search."
                : activeTab === 'my-tasks'
                ? "You haven't created any tasks yet. Create your first one to get help."
                : 'No tasks available right now. Check back soon, or post a new one.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {(searchTerm || filterDifficulty !== 'all' || filterPrice !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDifficulty('all');
                    setFilterPrice('all');
                  }}
                  className="btn btn-ghost"
                >
                  Clear filters
                </button>
              )}
              <button onClick={() => setShowCreateTask(true)} className="btn btn-cyan">
                <Plus className="w-4 h-4" /> Create task
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
            {displayedTasks.map((task, idx) => {
              const StatusIcon = getStatusIcon(task.status);
              const accent = getStatusAccent(task.status);
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTaskDetails(true);
                  }}
                  className="group bento bento-glow p-0 overflow-hidden cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                  data-testid="task-card"
                >
                  {/* Accent header strip */}
                  <div className={`relative h-28 bg-gradient-to-br ${accent} overflow-hidden`}>
                    <div className="absolute inset-0 opacity-40" style={{
                      background: 'radial-gradient(400px 200px at 90% -10%, rgba(255,255,255,.35), transparent 60%)'
                    }} />
                    <div className="relative h-full p-5 flex justify-between items-start">
                      <div className="flex flex-col gap-2 min-w-0">
                        <span className="text-[11px] font-mono bg-black/20 backdrop-blur px-2 py-0.5 rounded-md text-white w-fit">
                          #{task.id?.slice(0, 8)}
                        </span>
                        <h3 className="font-display text-xl text-white leading-tight line-clamp-2 pr-3">
                          {task.title}
                        </h3>
                      </div>
                      <span className="chip bg-black/25 ring-1 ring-white/20 text-white whitespace-nowrap shrink-0">
                        <StatusIcon className="w-3 h-3" />
                        {task.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-200">
                        <BookOpen className="w-4 h-4 text-cyan-500" />
                        {task.subject || 'General'}
                      </span>
                      <span className={getDifficultyPill(task.difficulty_level)}>
                        {task.difficulty_level === 'easy' && '🌱 Easy'}
                        {task.difficulty_level === 'medium' && '📈 Medium'}
                        {task.difficulty_level === 'hard' && '🚀 Hard'}
                        {!['easy', 'medium', 'hard'].includes(task.difficulty_level) && (task.difficulty_level || '—')}
                      </span>
                    </div>

                    <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed line-clamp-2 mb-4">
                      {task.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-2xl glass p-3 text-center">
                        <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <p className="font-display text-2xl leading-none">₹{task.price}</p>
                        <p className="text-[11px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mt-1">Budget</p>
                      </div>
                      <div className="rounded-2xl glass p-3 text-center">
                        <Calendar className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                        <p className="font-display text-base leading-none mt-1">
                          {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mt-1">Deadline</p>
                      </div>
                    </div>

                    {task.attachment_urls?.length > 0 && (
                      <div className="mb-4">
                        <span className="chip chip-ink">
                          <Paperclip className="w-3 h-3" />
                          {task.attachment_urls.length} file{task.attachment_urls.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10 gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white font-display text-sm shadow-soft shrink-0">
                          {task.creator_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{task.creator_name || 'Anonymous'}</p>
                          <p className="text-[11px] text-ink-500 dark:text-ink-300">{new Date(task.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.status === 'pending_payment' && task.creator_id === user?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentTask(task);
                              setPaymentModal(true);
                            }}
                            className="btn btn-coral px-3 py-1.5 text-xs"
                            data-testid="pay-now-button"
                          >
                            <Wallet className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}
                        {task.status === 'open' && task.creator_id !== user?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptTask(task.id);
                            }}
                            className="btn btn-cyan px-3 py-1.5 text-xs"
                            data-testid="accept-task-button"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Accept
                          </button>
                        )}
                        {task.status === 'accepted' && task.acceptor_id === user?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubmissionModal(true);
                              setShowTaskDetails(false);
                            }}
                            className="btn btn-primary px-3 py-1.5 text-xs"
                          >
                            <Send className="w-3.5 h-3.5" /> Submit
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setShowTaskDetails(true);
                          }}
                          className="btn btn-ghost px-3 py-1.5 text-xs"
                        >
                          Details <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateTask && (
          <div
            className="fixed inset-0 bg-ink-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateTask(false)}
            data-testid="create-task-modal"
          >
            <div
              className="bento bg-white dark:bg-ink-900 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden rounded-t-[28px] bg-ink-950 text-white p-7">
                <div className="absolute inset-0 opacity-60" style={{
                  background: 'radial-gradient(500px 300px at 0% 0%, rgba(34,211,238,.3), transparent 60%), radial-gradient(500px 300px at 100% 100%, rgba(255,106,91,.25), transparent 60%)'
                }} />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-3"><Sparkles className="w-3 h-3" /> new task</span>
                    <h2 className="font-display text-3xl md:text-4xl leading-tight">Create a <span className="italic text-gradient">task</span></h2>
                    <p className="mt-2 text-sm text-ink-300">Post the work, set the price, attract talent.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateTask(false)}
                    className="w-9 h-9 rounded-full glass grid place-items-center text-white/90 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="p-7 space-y-5">
                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">
                    Task Title * <span className="text-ink-400 normal-case tracking-normal">(min 10 chars)</span>
                  </span>
                  <input
                    type="text"
                    required
                    minLength="10"
                    maxLength="500"
                    className={`${inputClass} mt-1.5`}
                    placeholder="e.g. Help with Python data-cleaning assignment"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    data-testid="task-title-input"
                  />
                  {newTask.title && newTask.title.length < 10 && (
                    <p className="text-xs text-coral-500 mt-1.5">Title must be at least 10 characters ({newTask.title.length}/10)</p>
                  )}
                </div>

                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Description *</span>
                  <textarea
                    required
                    rows="4"
                    className={`${inputClass} mt-1.5`}
                    placeholder="Describe the task in detail. Include specific requirements, expectations, and any relevant info…"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    data-testid="task-description-input"
                  />
                </div>

                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Requirements</span>
                  <textarea
                    rows="3"
                    className={`${inputClass} mt-1.5`}
                    placeholder="List any specific skills, tools, or prerequisites…"
                    value={newTask.requirements}
                    onChange={(e) => setNewTask({ ...newTask, requirements: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Subject</span>
                    <input
                      type="text"
                      className={`${inputClass} mt-1.5`}
                      placeholder="e.g. Computer Science"
                      value={newTask.subject}
                      onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                      data-testid="task-subject-input"
                    />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Difficulty</span>
                    <select
                      className={`${inputClass} mt-1.5`}
                      value={newTask.difficulty_level}
                      onChange={(e) => setNewTask({ ...newTask, difficulty_level: e.target.value })}
                      data-testid="task-difficulty-select"
                    >
                      <option value="easy">🌱 Easy</option>
                      <option value="medium">📈 Medium</option>
                      <option value="hard">🚀 Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Price (₹) *</span>
                    <input
                      type="number"
                      required
                      min="1"
                      className={`${inputClass} mt-1.5`}
                      placeholder="500"
                      value={newTask.price}
                      onChange={(e) => setNewTask({ ...newTask, price: e.target.value })}
                      data-testid="task-price-input"
                    />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Deadline *</span>
                    <input
                      type="datetime-local"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className={`${inputClass} mt-1.5`}
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      data-testid="task-deadline-input"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Attachments</span>
                  <div className="mt-1.5">
                    <FileUploadZone
                      onFilesSelected={(files) => setNewTask({ ...newTask, attachmentFiles: files })}
                      maxFiles={5}
                      existingFiles={newTask.attachmentFiles}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTask(false)}
                    className="flex-1 btn btn-ghost py-3"
                    data-testid="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn btn-coral py-3 disabled:opacity-50"
                    data-testid="submit-task-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Create task
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showTaskDetails && selectedTask && (
          <div
            className="fixed inset-0 bg-ink-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowTaskDetails(false)}
          >
            <div
              className="bento bg-white dark:bg-ink-900 max-w-3xl w-full max-h-[92vh] overflow-y-auto p-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`relative overflow-hidden rounded-t-[28px] bg-gradient-to-br ${getStatusAccent(selectedTask.status)} text-white p-7`}>
                <div className="absolute inset-0 opacity-50" style={{
                  background: 'radial-gradient(500px 300px at 100% -10%, rgba(255,255,255,.35), transparent 60%)'
                }} />
                <div className="relative flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono bg-black/20 backdrop-blur px-2 py-0.5 rounded-md text-white">
                      Task #{selectedTask.id?.slice(0, 8)}
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl leading-tight mt-3">{selectedTask.title}</h2>
                  </div>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="w-9 h-9 rounded-full bg-black/25 ring-1 ring-white/20 grid place-items-center text-white/90 hover:text-white shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-7">
                {/* Status + Price */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                  <span className={getStatusPill(selectedTask.status)}>
                    {selectedTask.status?.replace('_', ' ')}
                  </span>
                  <span className="font-display text-3xl text-emerald-600 dark:text-emerald-400">₹{selectedTask.price}</span>
                </div>

                <div className="mb-6">
                  <h3 className="font-display text-2xl mb-2">Description</h3>
                  <p className="text-ink-600 dark:text-ink-200 whitespace-pre-wrap leading-relaxed">{selectedTask.description}</p>
                </div>

                {selectedTask.requirements && (
                  <div className="mb-6">
                    <h3 className="font-display text-2xl mb-2">Requirements</h3>
                    <p className="text-ink-600 dark:text-ink-200 whitespace-pre-wrap leading-relaxed">{selectedTask.requirements}</p>
                  </div>
                )}

                {selectedTask.attachment_urls && selectedTask.attachment_urls.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-display text-2xl mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-500" /> Task Attachments
                    </h3>
                    <div className="space-y-2">
                      {selectedTask.attachment_urls.map((url, index) => {
                        const filename = url.split('/').pop() || `attachment-${index + 1}`;
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-3 rounded-2xl glass hover:shadow-soft transition-all border border-transparent hover:border-cyan-400/30"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center shrink-0">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{filename}</p>
                                <p className="text-[11px] text-ink-500 dark:text-ink-300">Click to view / download</p>
                              </div>
                            </div>
                            <DownloadIcon className="w-5 h-5 text-ink-400 group-hover:text-cyan-500 transition-colors shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Subject', value: selectedTask.subject || 'General' },
                    { label: 'Difficulty', value: selectedTask.difficulty_level || '—' },
                    { label: 'Deadline', value: new Date(selectedTask.deadline).toLocaleString() },
                    { label: 'Created', value: new Date(selectedTask.created_at).toLocaleDateString() },
                  ].map((d, i) => (
                    <div key={i} className="rounded-2xl glass p-3.5">
                      <p className="text-[11px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-1">{d.label}</p>
                      <p className="font-medium text-sm">{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Creator */}
                <div className="mb-6 p-5 rounded-2xl glass border border-cyan-400/20">
                  <h3 className="font-display text-xl mb-3">Task creator</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white font-display text-xl shadow-soft">
                      {selectedTask.creator_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedTask.creator_name || 'Anonymous'}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300">
                        Member since {selectedTask.creator_joined ? new Date(selectedTask.creator_joined).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  {selectedTask.status === 'pending_payment' && selectedTask.creator_id === user?.id && (
                    <button
                      onClick={() => {
                        setPaymentModal(true);
                        setShowTaskDetails(false);
                      }}
                      className="w-full btn btn-coral py-3"
                      data-testid="pay-now-modal-button"
                    >
                      <Wallet className="w-5 h-5" /> Pay now to publish task
                    </button>
                  )}

                  {selectedTask.status === 'open' && selectedTask.creator_id === user?.id && (
                    <button
                      onClick={() => handleOpenApplicants(selectedTask)}
                      className="w-full btn btn-primary py-3"
                      data-testid="view-applicants-button"
                    >
                      <Users className="w-5 h-5" /> View applicants
                    </button>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {selectedTask.status === 'open' && selectedTask.creator_id !== user?.id && (
                      <button
                        onClick={() => {
                          handleAcceptTask(selectedTask.id);
                          setShowTaskDetails(false);
                        }}
                        className="flex-1 btn btn-cyan py-3"
                      >
                        <CheckCircle className="w-5 h-5" /> Accept task
                      </button>
                    )}

                    {selectedTask.status === 'accepted' && selectedTask.acceptor_id === user?.id && (
                      <button
                        onClick={() => {
                          setSubmissionModal(true);
                          setShowTaskDetails(false);
                        }}
                        className="flex-1 btn btn-primary py-3"
                      >
                        <Send className="w-5 h-5" /> Submit work
                      </button>
                    )}

                    {/* {selectedTask.status === 'accepted' && selectedTask.creator_id === user?.id && (
                      <button
                        onClick={() => setPaymentModal(true)}
                        className="flex-1 btn btn-cyan py-3"
                        data-testid="open-escrow-payment-modal-button"
                      >
                        <Wallet className="w-5 h-5" /> Pay escrow
                      </button>
                    )} */}

                    {selectedTask.status === 'submitted' && selectedTask.creator_id === user?.id && (
                      <>
                        <button
                          onClick={() => {
                            handleViewSubmissions(selectedTask);
                            setShowTaskDetails(false);
                          }}
                          className="flex-1 btn btn-cyan py-3"
                          data-testid="view-submissions-button"
                        >
                          <Eye className="w-5 h-5" /> View submission
                        </button>
                        <button
                          onClick={() => handleCompleteTask(selectedTask.id)}
                          className="flex-1 btn btn-coral py-3"
                        >
                          <Award className="w-5 h-5" /> Approve & complete
                        </button>
                      </>
                    )}

                    {(selectedTask.status === 'accepted' || selectedTask.status === 'submitted') &&
                      (selectedTask.creator_id === user?.id || selectedTask.acceptor_id === user?.id) && (
                        <button
                          onClick={() => {
                            handleOpenChat(selectedTask);
                            setShowTaskDetails(false);
                          }}
                          className="flex-1 btn btn-ghost py-3"
                          data-testid="open-task-chat-button"
                        >
                          <MessageSquare className="w-5 h-5" /> Chat
                        </button>
                      )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    {selectedTask.status !== 'completed' && selectedTask.creator_id === user?.id && (
                      <button
                        onClick={() => {
                          setCancelTask(selectedTask);
                          setShowCancelModal(true);
                          setShowTaskDetails(false);
                        }}
                        className="flex-1 btn py-3 bg-coral-500 text-white hover:bg-coral-600"
                        data-testid="cancel-task-button"
                      >
                        <XCircle className="w-5 h-5" /> Cancel task
                      </button>
                    )}

                    {(selectedTask.creator_id === user?.id || selectedTask.acceptor_id === user?.id) && (
                      <button
                        onClick={() => {
                          const otherUser =
                            selectedTask.creator_id === user?.id
                              ? { id: selectedTask.acceptor_id, username: 'Task Acceptor' }
                              : { id: selectedTask.creator_id, username: selectedTask.creator_name || 'Task Creator' };
                          setReportUser(otherUser);
                          setReportTask(selectedTask);
                          setShowReportModal(true);
                          setShowTaskDetails(false);
                        }}
                        className="flex-1 btn btn-ghost py-3 text-coral-600 dark:text-coral-300 hover:bg-coral-500/10"
                        data-testid="report-user-button"
                      >
                        <Flag className="w-5 h-5" /> Report user
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submission Modal */}
        {submissionModal && selectedTask && (
          <div
            className="fixed inset-0 bg-ink-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSubmissionModal(false)}
          >
            <div className="bento bg-white dark:bg-ink-900 max-w-md w-full p-0" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden rounded-t-[28px] bg-ink-950 text-white p-6">
                <div className="absolute inset-0 opacity-60" style={{
                  background: 'radial-gradient(400px 250px at 0% 0%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 250px at 100% 100%, rgba(255,106,91,.2), transparent 60%)'
                }} />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-2"><Send className="w-3 h-3" /> submission</span>
                    <h2 className="font-display text-2xl">Submit your <span className="italic text-gradient-cyan">work</span></h2>
                  </div>
                  <button
                    onClick={() => setSubmissionModal(false)}
                    className="w-9 h-9 rounded-full glass grid place-items-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Submission message</span>
                  <textarea
                    className={`${inputClass} mt-1.5`}
                    rows="4"
                    placeholder="Add a message about your work…"
                    value={submissionData.message}
                    onChange={(e) => setSubmissionData({ ...submissionData, message: e.target.value })}
                  />
                </div>

                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Attachments</span>
                  <div className="mt-1.5">
                    <FileUploadZone
                      onFilesSelected={(files) => setSubmissionData({ ...submissionData, attachmentFiles: files })}
                      maxFiles={5}
                      existingFiles={submissionData.attachmentFiles}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setSubmissionModal(false)} className="flex-1 btn btn-ghost py-3">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTask}
                    disabled={loading}
                    className="flex-1 btn btn-primary py-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Submissions Modal */}
        {viewSubmissionsModal && selectedTask && (
          <div
            className="fixed inset-0 bg-ink-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setViewSubmissionsModal(false)}
          >
            <div className="bento bg-white dark:bg-ink-900 max-w-4xl w-full max-h-[92vh] overflow-y-auto p-0" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden rounded-t-[28px] bg-ink-950 text-white p-6">
                <div className="absolute inset-0 opacity-60" style={{
                  background: 'radial-gradient(500px 300px at 0% 0%, rgba(34,211,238,.3), transparent 60%), radial-gradient(500px 300px at 100% 100%, rgba(99,102,241,.25), transparent 60%)'
                }} />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-2"><Eye className="w-3 h-3" /> review</span>
                    <h2 className="font-display text-3xl">Task <span className="italic text-gradient-cyan">submissions</span></h2>
                  </div>
                  <button
                    onClick={() => setViewSubmissionsModal(false)}
                    className="w-9 h-9 rounded-full glass grid place-items-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-5">
                  <h3 className="font-display text-xl">{selectedTask.title}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-300 mt-1 font-mono">#{selectedTask.id?.slice(0, 8)}</p>
                </div>

                {taskSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-ink-400 to-ink-600 grid place-items-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <p className="mt-4 text-ink-500 dark:text-ink-300">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {taskSubmissions.map((submission) => (
                      <div key={submission.id} className="rounded-2xl glass p-5 border border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white font-display shadow-soft">
                            {submission.submitter?.full_name?.charAt(0) || submission.submitter?.username?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {submission.submitter?.full_name || submission.submitter?.username || 'Anonymous'}
                            </p>
                            <p className="text-xs text-ink-500 dark:text-ink-300">
                              Submitted {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                          </div>
                          {submission.is_approved && (
                            <span className="chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                              <Check className="w-3 h-3" /> Approved
                            </span>
                          )}
                        </div>

                        {submission.submission_text && (
                          <div className="mb-4">
                            <p className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">Message</p>
                            <p className="text-sm whitespace-pre-wrap p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10">
                              {submission.submission_text}
                            </p>
                          </div>
                        )}

                        {submission.submission_files && submission.submission_files.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">Attachments</p>
                            <div className="space-y-2">
                              {submission.submission_files.map((fileUrl, fileIndex) => (
                                <a
                                  key={fileIndex}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex items-center gap-3 p-3 rounded-xl glass hover:shadow-soft transition-all border border-transparent hover:border-cyan-400/30"
                                >
                                  <FileText className="w-5 h-5 text-cyan-500" />
                                  <span className="flex-1 text-sm">Attachment {fileIndex + 1}</span>
                                  <Download className="w-4 h-4 text-ink-400 group-hover:text-cyan-500" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {submission.review_notes && (
                          <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
                            <p className="text-xs uppercase tracking-widest text-cyan-700 dark:text-cyan-300 mb-1">Review notes</p>
                            <p className="text-sm">{submission.review_notes}</p>
                          </div>
                        )}

                        {!submission.is_approved && selectedTask.creator_id === user?.id && (
                          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
                            <button
                              onClick={() => {
                                handleCompleteTask(selectedTask.id);
                                setViewSubmissionsModal(false);
                              }}
                              className="w-full btn btn-coral py-3"
                            >
                              <CheckCircle className="w-5 h-5" /> Approve & complete task
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Escrow Payment Modal */}
        {paymentModal && paymentTask && (
          <div
            className="fixed inset-0 bg-ink-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setPaymentModal(false)}
            data-testid="escrow-payment-modal"
          >
            <div className="bento bg-white dark:bg-ink-900 max-w-md w-full p-0" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden rounded-t-[28px] bg-ink-950 text-white p-6">
                <div className="absolute inset-0 opacity-60" style={{
                  background: 'radial-gradient(400px 250px at 0% 0%, rgba(34,211,238,.3), transparent 60%), radial-gradient(400px 250px at 100% 100%, rgba(99,102,241,.25), transparent 60%)'
                }} />
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="chip chip-cyan mb-2"><Wallet className="w-3 h-3" /> escrow</span>
                    <h2 className="font-display text-2xl">Pay to <span className="italic text-gradient-cyan">publish</span></h2>
                  </div>
                  <button
                    onClick={() => setPaymentModal(false)}
                    className="w-9 h-9 rounded-full glass grid place-items-center"
                    data-testid="close-escrow-payment-modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-2xl glass p-4 border border-black/5 dark:border-white/10">
                  <p className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-1">Task</p>
                  <p className="font-semibold" data-testid="escrow-task-title">{paymentTask.title}</p>
                  <p className="font-display text-3xl text-cyan-500 mt-2" data-testid="escrow-payment-amount">₹{paymentTask.price}</p>
                </div>

                <p className="text-sm text-ink-600 dark:text-ink-200" data-testid="escrow-payment-note">
                  Payment will be held in escrow and released once you approve the submitted work.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentModal(false)}
                    className="flex-1 btn btn-ghost py-3"
                    data-testid="escrow-payment-cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayEscrow}
                    disabled={paymentLoading}
                    className="flex-1 btn btn-cyan py-3 disabled:opacity-50"
                    data-testid="escrow-payment-confirm-button"
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" /> Pay with Razorpay
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && chatTask && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bento bg-white dark:bg-ink-900 w-full max-w-2xl h-[600px] p-0 overflow-hidden">
            <RealtimeChat
              roomType="task"
              roomId={chatTask.id}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Task Applicants Modal */}
      <TaskApplicantsModal
        task={applicantsTask}
        isOpen={showApplicants}
        onClose={() => setShowApplicants(false)}
        onApplicantAssigned={handleApplicantAssigned}
      />

      {/* Payment Modal (component) */}
      <PaymentModal
        task={paymentTask}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Cancel Task Modal */}
      <TaskCancelModal
        task={cancelTask}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSuccess={(response) => {
          showNotification(response.message || 'Task cancelled successfully', 'success');
          loadTasks();
          setShowCancelModal(false);
        }}
      />

      {/* Report User Modal */}
      <ReportModal
        reportedUser={reportUser}
        task={reportTask}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => {
          showNotification('Report submitted successfully. Our team will review it.', 'success');
          setShowReportModal(false);
        }}
      />
    </div>
  );
};

export default TaskMarketplace;
