import React, { useState, useEffect } from 'react';
import { Bell, X, Loader2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications/');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    if (notification.reference_type === 'connection' && notification.notification_type === 'connection_request') {
      navigate('/profile');
    } else if (notification.reference_type === 'learning_session' || notification.notification_type === 'session_request') {
      navigate('/sessions');
    } else if (notification.reference_type === 'task') {
      navigate('/tasks');
    }

    onClose();
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div
      className="tc-modal-backdrop flex items-start justify-end p-4"
      onClick={onClose}
    >
      <div
        className="bento rounded-[24px] w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col mt-16 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-ink-950 text-white p-5 overflow-hidden">
          <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(400px 250px at 0% 0%, rgba(34,211,238,.32), transparent 60%), radial-gradient(400px 250px at 100% 100%, rgba(255,106,91,.25), transparent 60%)' }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center backdrop-blur">
                <Bell className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h2 className="font-display text-2xl leading-none">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="chip chip-coral mt-1">{unreadCount} new</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                >
                  Mark all read
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="tc-spinner" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state m-5">
              <Bell className="w-8 h-8 text-ink-400" />
              <p className="font-display text-xl">All caught up</p>
              <p className="text-sm text-ink-500">You'll see new updates here</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-cyan-500/5 dark:hover:bg-white/5 cursor-pointer transition ${
                    !notification.is_read ? 'bg-cyan-500/5 dark:bg-cyan-500/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-ink-950 dark:text-white text-sm">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-ink-600 dark:text-ink-200">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-ink-500 dark:text-ink-300 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="w-8 h-8 rounded-full grid place-items-center hover:bg-coral-500/10 text-ink-400 hover:text-coral-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

export default NotificationsPanel;
