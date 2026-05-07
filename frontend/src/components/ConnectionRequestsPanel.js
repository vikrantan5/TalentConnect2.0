import React, { useState, useEffect } from 'react';
import { Users, Check, X, Loader2 } from 'lucide-react';
import api from '../services/api';

const ConnectionRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadConnectionRequests();
  }, []);

  const loadConnectionRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/connection-requests');
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error loading connection requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (connectionId, accept) => {
    try {
      setProcessing(connectionId);
      await api.post(`/api/users/connections/respond/${connectionId}`, { accept });

      setRequests(requests.filter(r => r.connection_id !== connectionId));

      alert(`Connection request ${accept ? 'accepted' : 'rejected'}!`);
    } catch (error) {
      console.error('Error responding to connection request:', error);
      alert('Failed to respond to connection request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="tc-spinner" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <Users className="w-8 h-8 text-ink-400" />
        <p className="font-display text-xl">No pending requests</p>
        <p className="text-sm text-ink-500">Connection requests will show up here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="chip chip-cyan"><Users className="w-3 h-3" /> requests</span>
        <h3 className="font-display text-2xl text-ink-950 dark:text-white">
          {requests.length} pending
        </h3>
      </div>
      {requests.map((request) => (
        <div
          key={request.connection_id}
          className="bento p-4"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white font-display text-xl">
                {request.sender.profile_photo ? (
                  <img
                    src={request.sender.profile_photo}
                    alt={request.sender.full_name || request.sender.username}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  (request.sender.full_name || request.sender.username).charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-ink-950 dark:text-white">
                  {request.sender.full_name || request.sender.username}
                </p>
                <p className="text-xs text-ink-500 dark:text-ink-300">
                  {request.sender.bio ? request.sender.bio.substring(0, 60) + '…' : 'Wants to connect with you'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(request.connection_id, true)}
                disabled={processing === request.connection_id}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white grid place-items-center transition disabled:opacity-50"
                title="Accept"
              >
                {processing === request.connection_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleResponse(request.connection_id, false)}
                disabled={processing === request.connection_id}
                className="w-10 h-10 rounded-full bg-coral-500 hover:bg-coral-600 text-white grid place-items-center transition disabled:opacity-50"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionRequestsPanel;
