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
      
      // Remove from list
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No pending connection requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Connection Requests ({requests.length})
      </h3>
      {requests.map((request) => (
        <div
          key={request.connection_id}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {request.sender.profile_photo ? (
                  <img
                    src={request.sender.profile_photo}
                    alt={request.sender.full_name || request.sender.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (request.sender.full_name || request.sender.username).charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {request.sender.full_name || request.sender.username}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {request.sender.bio ? request.sender.bio.substring(0, 60) + '...' : 'Wants to connect with you'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(request.connection_id, true)}
                disabled={processing === request.connection_id}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                title="Accept"
              >
                {processing === request.connection_id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => handleResponse(request.connection_id, false)}
                disabled={processing === request.connection_id}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                title="Reject"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionRequestsPanel;
