import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, Star, Send, Check, Clock, Users as UsersIcon } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BrowseUsersModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingRequest, setSendingRequest] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/browse?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const sendConnectionRequest = async (userId) => {
    setSendingRequest({ ...sendingRequest, [userId]: true });
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/users/connections/send-request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(users.map(u =>
        u.id === userId ? { ...u, connection_status: 'pending' } : u
      ));

      alert('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert(error.response?.data?.detail || 'Failed to send connection request');
    }
    setSendingRequest({ ...sendingRequest, [userId]: false });
  };

  if (!isOpen) return null;

  return (
    <div className="tc-modal-backdrop flex items-center justify-center p-4 z-[999]" onClick={onClose}>
      <div className="bento rounded-[28px] max-w-4xl w-full max-h-[85vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-ink-950 text-white p-7 overflow-hidden">
          <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(500px 300px at 0% 0%, rgba(34,211,238,.4), transparent 60%), radial-gradient(500px 300px at 100% 100%, rgba(99,102,241,.32), transparent 60%)' }} />
          <div className="relative flex items-center justify-between mb-5">
            <div>
              <span className="chip chip-cyan mb-2"><UsersIcon className="w-3 h-3" /> people</span>
              <h2 className="font-display text-3xl leading-tight">
                Browse <span className="italic text-gradient-cyan">members</span>
              </h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input
              type="text"
              placeholder="Search by name or username…"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-ink-300 backdrop-blur outline-none focus:border-cyan-400 focus:shadow-glow transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users List */}
        <div className="p-7 overflow-y-auto max-h-[calc(85vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="tc-spinner" />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <UsersIcon className="w-8 h-8 text-ink-400" />
              <p className="font-display text-xl">No members found</p>
              <p className="text-sm text-ink-500">Try a different search</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {users.map((user) => (
                <div key={user.id} className="bento p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-400 to-indigo-500 flex-shrink-0 grid place-items-center text-white font-display text-2xl">
                      {user.profile_photo ? (
                        <img src={user.profile_photo} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user.username?.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg leading-tight text-ink-950 dark:text-white truncate">
                          {user.full_name || user.username}
                        </h3>
                        {user.average_rating > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            {user.average_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-500 dark:text-ink-300 mb-2">@{user.username}</p>

                      {user.bio && (
                        <p className="text-xs text-ink-600 dark:text-ink-200 mb-2 line-clamp-2">{user.bio}</p>
                      )}

                      {user.top_skills && user.top_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {user.top_skills.map((skill, idx) => (
                            <span key={idx} className="chip chip-cyan">{skill}</span>
                          ))}
                        </div>
                      )}

                      <div>
                        {user.connection_status === 'accepted' ? (
                          <button disabled className="w-full btn btn-ghost py-2 text-emerald-600 dark:text-emerald-300">
                            <Check className="w-4 h-4" />
                            Connected
                          </button>
                        ) : user.connection_status === 'pending' ? (
                          <button disabled className="w-full btn btn-ghost py-2 text-amber-600 dark:text-amber-300">
                            <Clock className="w-4 h-4" />
                            Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => sendConnectionRequest(user.id)}
                            disabled={sendingRequest[user.id]}
                            className="w-full btn btn-cyan py-2 disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            {sendingRequest[user.id] ? 'Sending…' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseUsersModal;
