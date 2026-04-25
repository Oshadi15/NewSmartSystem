import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { user, isAdmin, isTechnician } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || 'User';
  const [unreadCount, setUnreadCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  // Load unread notification count and open ticket count for badges
  useEffect(() => {
    if (!user?.userId) return;
    apiService.getUserNotifications(user.userId)
      .then(res => {
        const notifs = Array.isArray(res.data) ? res.data : [];
        setUnreadCount(notifs.filter(n => !n.readStatus).length);
      })
      .catch(() => {});

    apiService.getUserTickets(user.userId)
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        setTicketCount(all.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length);
      })
      .catch(() => {});
  }, [user?.userId]);

  const cards = [
    ...(!isTechnician ? [{
      icon: '📅',
      title: 'My Bookings',
      text: 'Create and track room or lab reservations.',
      to: '/my-bookings',
      accent: '#60a5fa',
    }] : []),
    {
      icon: '🎫',
      title: 'Tickets',
      text: 'Report issues, track status updates.',
      to: '/tickets',
      accent: '#fbbf24',
      badge: ticketCount > 0 ? ticketCount : null,
      badgeColor: '#fbbf24',
      action: () => navigate(isTechnician ? '/tickets' : '/tickets?openForm=1'),
    },
    {
      icon: '🔔',
      title: 'Notifications',
      text: 'Stay informed with real-time alerts.',
      to: '/notifications',
      accent: '#f87171',
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: '#f87171',
    },
    ...(isAdmin ? [{
      icon: '⚙️',
      title: 'Admin Dashboard',
      text: 'Manage users, bookings and all tickets.',
      to: '/admin',
      accent: '#a78bfa',
    }] : []),
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <div className="page-header home-header">
        <div>
          <h1 className="page-title">Welcome, <span className="home-name">{displayName}</span> 👋</h1>
          <p className="page-subtitle">
            Use the sidebar or the quick links below to manage your campus operations.
          </p>
        </div>
      </div>

      {/* Hero card */}
      <div className="home-hero-card">
        <div className="home-hero-head">
          <span className="home-hero-icon">🏫</span>
          <div>
            <h2 className="home-hero-title">Smart Campus Operations Hub</h2>
            <p className="home-hero-subtitle">Everything is connected and ready.</p>
          </div>
        </div>
        <p className="home-hero-text">
          Monitor resources, handle support requests, and keep campus operations running smoothly from one place.
        </p>
      </div>

      {/* Quick-action cards */}
      <p className="home-section-label">Quick Access</p>
      <div className="home-quick-grid">
        {cards.map(card => (
          <button
            key={card.title}
            className="home-quick-card"
            onClick={card.action || (() => navigate(card.to))}
            style={{ '--card-accent': card.accent }}
          >
            <div className="home-quick-icon-wrap">
              <span className="home-quick-icon">{card.icon}</span>
              {card.badge && (
                <span
                  className="home-quick-badge"
                  style={{ background: card.badgeColor }}
                >
                  {card.badge}
                </span>
              )}
            </div>
            <div className="home-quick-title">{card.title}</div>
            <div className="home-quick-text">{card.text}</div>
            <div className="home-quick-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
