import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Loader2, Clock } from 'lucide-react';
import api from '../services/api';

const SessionRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    loadSessionRequests();
  }, []);

  const loadSessionRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/sessions/requests/received');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error loading session requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessing(requestId);
      await api.post(`/api/sessions/requests/${requestId}/reject`);
      setRequests(requests.filter(r => r.request.id !== requestId));
      alert('Session request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      if (!meetingLink || !scheduledDate || !scheduledTime) {
        alert('Please fill in all fields');
        return;
      }

      setProcessing(requestId);
      const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;
      
      await api.post(`/api/sessions/requests/${requestId}/accept`, {
        meeting_link: meetingLink,
        scheduled_at: scheduledAt,
        duration_minutes: 60
      });

      setRequests(requests.filter(r => r.request.id !== requestId));
      setShowAcceptModal(null);
      setMeetingLink('');
      setScheduledDate('');
      setScheduledTime('');
      alert('Session request accepted! Meeting scheduled.');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No pending session requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Session Requests ({requests.length})
      </h3>
      {requests.map((item) => (
        <div
          key={item.request.id}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {item.sender.profile_photo ? (
                  <img
                    src={item.sender.profile_photo}
                    alt={item.sender.full_name || item.sender.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (item.sender.full_name || item.sender.username).charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {item.sender.full_name || item.sender.username}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Wants to learn: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.request.skill_wanted}</span>
                </p>
                {item.request.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    "{item.request.message}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowAcceptModal(item.request.id)}
                disabled={processing === item.request.id}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(item.request.id)}
                disabled={processing === item.request.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
              >
                Reject
              </button>
            </div>
          </div>

          {/* Accept Modal */}
          {showAcceptModal === item.request.id && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Schedule Session</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meeting Link (Google Meet, Zoom, etc.)
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAcceptModal(null);
                    setMeetingLink('');
                    setScheduledDate('');
                    setScheduledTime('');
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAccept(item.request.id)}
                  disabled={processing === item.request.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {processing === item.request.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm & Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SessionRequestsPanel;
