import React from 'react';

const TYPE_META = {
  BOOKING_APPROVED:      { icon: '✅', bg: 'rgba(0,184,148,0.15)'   },
  BOOKING_REJECTED:      { icon: '❌', bg: 'rgba(255,118,117,0.15)' },
  BOOKING_CANCELLED:     { icon: '🚫', bg: 'rgba(100,116,139,0.15)' },
  TICKET_STATUS_CHANGED: { icon: '📋', bg: 'rgba(116,185,255,0.15)' },
  NEW_COMMENT:           { icon: '💬', bg: 'rgba(162,155,254,0.15)' },
  GENERAL:               { icon: '🔔', bg: 'rgba(108,92,231,0.15)'  },
};

const fmt = (dt) => dt ? new Date(dt).toLocaleString() : '';

const NotificationList = ({ notifications, onMarkRead }) => {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '48px 20px' }}>
        <div className="empty-icon">🔔</div>
        <p className="empty-text">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="notif-list" style={{ background: 'var(--glass-bg)' }}>
      {notifications.map(n => {
        const meta = TYPE_META[n.type] || TYPE_META.GENERAL;
        return (
          <div key={n.id} className={`notif-item${!n.readStatus ? ' unread' : ''}`}>
            <div className="notif-icon-wrap" style={{ background: meta.bg }}>
              {meta.icon}
            </div>
            <div className="notif-body">
              <p className="notif-msg">{n.message}</p>
              <p className="notif-meta">
                {n.type?.replace(/_/g, ' ')}
                {n.createdAt && ` · ${fmt(n.createdAt)}`}
                {n.readStatus && ' · Read'}
              </p>
            </div>
            {!n.readStatus && (
              <button className="btn btn-ghost btn-xs" onClick={() => onMarkRead(n.id)}>
                ✓ Read
              </button>
            )}
            {!n.readStatus && <div className="notif-unread-dot" />}
          </div>
        );
      })}
    </div>
  );
};

export default NotificationList;
