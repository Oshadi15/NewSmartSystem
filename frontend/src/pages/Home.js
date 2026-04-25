import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const displayName = user?.name || 'User';

  return (
    <div className="home-page">
      <div className="page-header">
        <h1 className="page-title">Welcome, {displayName}</h1>
        <p className="page-subtitle">
          Use the sidebar to manage bookings, tickets, notifications, and admin tools.
        </p>
      </div>

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

      <div className="home-quick-grid">
        <div className="home-quick-card">
          <div className="home-quick-icon">📅</div>
          <div className="home-quick-title">Bookings</div>
          <div className="home-quick-text">Create and track room or lab reservations.</div>
        </div>
        <div className="home-quick-card">
          <div className="home-quick-icon">🎫</div>
          <div className="home-quick-title">Tickets</div>
          <div className="home-quick-text">Report issues and follow status updates.</div>
        </div>
        <div className="home-quick-card">
          <div className="home-quick-icon">🔔</div>
          <div className="home-quick-title">Notifications</div>
          <div className="home-quick-text">Stay informed with real-time alerts.</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
