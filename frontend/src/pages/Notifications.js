import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuth }    from '../contexts/AuthContext';

const TYPE_META = {
  BOOKING_APPROVED:      { icon: '✅', bg: 'rgba(0,184,148,0.15)',   label: 'Booking Approved' },
  BOOKING_REJECTED:      { icon: '❌', bg: 'rgba(255,118,117,0.15)', label: 'Booking Rejected' },
  BOOKING_CANCELLED:     { icon: '🚫', bg: 'rgba(100,116,139,0.15)', label: 'Booking Cancelled' },
  TICKET_STATUS_CHANGED: { icon: '📋', bg: 'rgba(116,185,255,0.15)', label: 'Ticket Updated' },
  NEW_COMMENT:           { icon: '💬', bg: 'rgba(162,155,254,0.15)', label: 'New Comment' },
  GENERAL:               { icon: '🔔', bg: 'rgba(108,92,231,0.15)',  label: 'General' },
};

const relativeTime = (dt) => {
  if (!dt) return '';
  const diff = Date.now() - new Date(dt).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [message,  setMessage]  = useState('');
  const [filter,   setFilter]   = useState('all');

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const res = await apiService.getUserNotifications(user.userId);
      setNotifications(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { if (error)   { const t = setTimeout(() => setError(''),   6000); return () => clearTimeout(t); } }, [error]);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(''), 3000); return () => clearTimeout(t); } }, [message]);

  const handleMarkRead = async (id) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: true } : n));
    } catch (err) { setError(err.message); }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead(user.userId);
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      setMessage('All notifications marked as read.');
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) { setError(err.message); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
    try {
      await apiService.clearAllNotifications(user.userId);
      setNotifications([]);
      setMessage('All notifications cleared.');
    } catch (err) { setError(err.message); }
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;
  const displayed   = filter === 'unread' ? notifications.filter(n => !n.readStatus) : notifications;

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="badge badge-rejected" style={{ marginLeft: 10, fontSize: '0.7rem', padding: '4px 10px' }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="page-subtitle">Stay updated on your bookings and ticket progress</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead} id="mark-all-read-btn">✓ Mark All Read</button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClearAll} id="clear-all-notifs-btn">🗑 Clear All</button>
          )}
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: 22 }}>
        <button className={`tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All <span className="tab-count">{notifications.length}</span>
        </button>
        <button className={`tab${filter === 'unread' ? ' active' : ''}`} onClick={() => setFilter('unread')}>
          Unread <span className="tab-count">{unreadCount}</span>
        </button>
      </div>

      {/* Notification list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 20px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skel-text" style={{ width: '70%', marginBottom: 8 }} />
                <div className="skeleton skel-text" style={{ width: '40%', height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">🔕</div>
            <p className="empty-text">
              {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet. Actions will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="notif-list" style={{ background: 'var(--glass-bg)' }}>
          {displayed.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.GENERAL;
            return (
              <div key={n.id} className={`notif-item${!n.readStatus ? ' unread' : ''}`}>
                {/* Icon */}
                <div className="notif-icon-wrap" style={{ background: meta.bg }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="notif-body">
                  <p className="notif-msg">{n.message}</p>
                  <p className="notif-meta">
                    {meta.label} · {relativeTime(n.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexShrink: 0 }}>
                  {!n.readStatus && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="btn btn-ghost btn-xs"
                      title="Mark as read"
                    >
                      ✓ Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="btn btn-danger btn-xs"
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>

                {/* Unread indicator dot */}
                {!n.readStatus && <div className="notif-unread-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Notifications;
