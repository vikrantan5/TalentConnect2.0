import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UserProfileModal from '../components/UserProfileModal';
import PerfectMatchCard from '../components/PerfectMatchCard';
import MentorMatchCard from '../components/MentorMatchCard';
import LearnerMatchCard from '../components/LearnerMatchCard';
import StartExchangeModal from '../components/StartExchangeModal';
import MentorBookingModal from '../components/MentorBookingModal';
import { useAuth } from '../context/AuthContext';
import { Flame, GraduationCap, BookOpen, Sparkles, RefreshCw, Loader2, Users } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Matches = () => {
  const { user, darkMode } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [perfectMatches, setPerfectMatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [learners, setLearners] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load all match types
      const [perfectRes, mentorsRes, learnersRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/match/perfect`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/match/mentors`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/match/learners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPerfectMatches(perfectRes.data.perfect_matches || []);
      setMentors(mentorsRes.data.mentors || []);
      setLearners(learnersRes.data.learners || []);
      setAiSuggestions(mentorsRes.data.ai_suggestions || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleChat = async (match) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/chat/create`,
        { receiver_id: match.user_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Navigate to messages page with chat ID to auto-open the conversation
      const chatId = response.data.chat?.id;
      if (chatId) {
        navigate(`/messages?chat=${chatId}`);
      } else {
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat. Please try again.');
    }
  };

  const handleStartExchange = (match) => {
    setSelectedMatch(match);
    setShowExchangeModal(true);
  };

  const handleBookMentor = (mentor) => {
    setSelectedMatch(mentor);
    setShowMentorModal(true);
  };

  const handleViewProfile = (match) => {
    setSelectedUserId(match.user_id);
    setShowProfileModal(true);
  };

  const handleBookingSuccess = () => {
    alert('Session request sent successfully!');
    loadMatches();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Finding your perfect matches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Your Matches
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered skill matching to help you grow
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Matches
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{perfectMatches.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Perfect Matches</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{mentors.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Available Mentors</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{learners.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Eager Learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {perfectMatches.length > 0 && (
            <div className="mb-12" data-testid="perfect-matches-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center animate-pulse">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                    Perfect Skill Exchange Matches
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Mutual skill exchange opportunities - best matches for you!
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {perfectMatches.map((match) => (
                  <PerfectMatchCard
                    key={match.user_id}
                    match={match}
                    onChat={handleChat}
                    onStartExchange={handleStartExchange}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {mentors.length > 0 && (
            <div className="mb-12" data-testid="mentors-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                    Recommended Mentors
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Experts who can teach what you want to learn
                  </p>
                </div>
              </div>

                          {aiSuggestions.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                      AI Suggestions: Also consider learning these skills
                    </p>
                  </div>
                  <div className="space-y-2">
                    {aiSuggestions.map((skill, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-start gap-3">
                          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold">
                            {skill.skill_name || skill}
                          </span>
                          {skill.difficulty && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                              {skill.difficulty}
                            </span>
                          )}
                          {skill.learning_time_weeks && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                              ~{skill.learning_time_weeks} weeks
                            </span>
                          )}
                        </div>
                        {skill.reason && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {skill.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor) => (
                  <MentorMatchCard
                    key={mentor.user_id}
                    mentor={mentor}
                    onChat={handleChat}
                    onBookSession={handleBookMentor}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {learners.length > 0 && (
            <div className="mb-12" data-testid="learners-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                    Recommended Learners
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    People who want to learn what you can teach
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learners.map((learner) => (
                  <LearnerMatchCard
                    key={learner.user_id}
                    learner={learner}
                    onChat={handleChat}
                    onConnect={handleBookMentor}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {perfectMatches.length === 0 && mentors.length === 0 && learners.length === 0 && (
            <div className="text-center py-20">
              <Users className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No matches found yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add skills you can teach and want to learn to get matched!
              </p>
              <button
                onClick={() => navigate('/skills')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
              >
                Add Your Skills
              </button>
            </div>
          )}
        </div>
      </div>

      <StartExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        match={selectedMatch}
        onSuccess={handleBookingSuccess}
      />

      <MentorBookingModal
        isOpen={showMentorModal}
        onClose={() => setShowMentorModal(false)}
        mentor={selectedMatch}
        onSuccess={handleBookingSuccess}
      />

      {showProfileModal && selectedUserId && (
        <UserProfileModal
         isOpen={showProfileModal}
          userId={selectedUserId}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default Matches;
