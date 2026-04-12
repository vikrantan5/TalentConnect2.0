import React, { useState } from 'react';
import {
  X,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  MessageSquare,
  Award,
  CheckCircle,
  Globe,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Video,
  Heart,
  Share2,
  Loader2,
  GraduationCap,
  Crown,
  Target
} from 'lucide-react';

const MentorDetailModal = ({ isOpen, onClose, mentor, onBookSession, onSendMessage }) => {
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    duration: 60,
    message: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !mentor) return null;

  const handleBookSession = async () => {
    setLoading(true);
    try {
      await onBookSession(mentor, bookingData);
      setShowBooking(false);
      setBookingData({ date: '', time: '', duration: 60, message: '' });
    } catch (error) {
      console.error('Booking error:', error);
    }
    setLoading(false);
  };

  const getLevelIcon = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return GraduationCap;
      case 'intermediate': return TrendingUp;
      case 'advanced': return Award;
      case 'expert': return Crown;
      default: return Target;
    }
  };

  const getLevelColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'expert': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const LevelIcon = getLevelIcon(mentor.skill_level);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="mentor-detail-modal"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Banner */}
        <div className="relative h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-t-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors z-10"
            data-testid="close-mentor-modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-2xl">
              <div className="w-full h-full rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                <span className="text-5xl font-bold text-indigo-600">
                  {(mentor.full_name || mentor.username)?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Availability Badge */}
          {mentor.is_available !== undefined && (
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                mentor.is_available 
                  ? 'bg-green-500/20 text-green-300 border border-green-400' 
                  : 'bg-gray-500/20 text-gray-300 border border-gray-400'
              }`}>
                {mentor.is_available ? '🟢 Online' : '⚪ Offline'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8 pt-20">
          {/* Basic Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {mentor.full_name || mentor.username}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">@{mentor.username}</p>
                
                {mentor.location && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {mentor.location}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSendMessage && onSendMessage(mentor)}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid="message-mentor-button"
                >
                  <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Skills & Level */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg font-medium">
                {mentor.skill_name}
              </span>
              <span className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${getLevelColor(mentor.skill_level)}`}>
                <LevelIcon className="w-4 h-4" />
                {mentor.skill_level}
              </span>
              {mentor.is_verified && (
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mentor.average_rating?.toFixed(1) || '0.0'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rating ({mentor.total_ratings || 0} reviews)</p>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mentor.total_sessions || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mentor.total_students || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Briefcase className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mentor.years_experience || 0}+
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Years Exp</p>
            </div>
          </div>

          {/* Bio */}
          {mentor.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{mentor.bio}</p>
            </div>
          )}

          {/* Hourly Rate */}
          {mentor.hourly_rate && (
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hourly Rate:</span>
                </div>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  ${mentor.hourly_rate}/hr
                </span>
              </div>
            </div>
          )}

          {/* Booking Section */}
          {!showBooking ? (
            <button
              onClick={() => setShowBooking(true)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25 font-medium flex items-center justify-center gap-2"
              data-testid="book-session-button"
            >
              <Calendar className="w-5 h-5" />
              Book a Session
            </button>
          ) : (
            <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule Session</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    data-testid="booking-date-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bookingData.time}
                    onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                    data-testid="booking-time-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={bookingData.duration}
                  onChange={(e) => setBookingData({ ...bookingData, duration: parseInt(e.target.value) })}
                  data-testid="booking-duration-select"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  placeholder="What would you like to learn?"
                  value={bookingData.message}
                  onChange={(e) => setBookingData({ ...bookingData, message: e.target.value })}
                  data-testid="booking-message-textarea"
                ></textarea>
              </div>

              {mentor.hourly_rate && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                      ${((mentor.hourly_rate / 60) * bookingData.duration).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBooking(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid="cancel-booking-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookSession}
                  disabled={loading || !bookingData.date || !bookingData.time}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  data-testid="confirm-booking-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDetailModal;
