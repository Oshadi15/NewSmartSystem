import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TopNavbar = ({ sidebarCollapsed, onMobileMenuToggle }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className={`top-navbar${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={onMobileMenuToggle}
        id="mobile-menu-toggle"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      {/* Search bar */}
      <div className="navbar-search">
        <span className="navbar-search-icon">🔍</span>
        <input
          type="text"
          id="navbar-search-input"
          placeholder="Search resources, bookings..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          aria-label="Search"
        />
      </div>

      <div className="navbar-spacer" />

      <div className="navbar-actions">
        {/* Notifications */}
        <button
          className="navbar-icon-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
          id="nav-notifications-btn"
          aria-label="Notifications"
        >
          🔔
          <span className="notif-dot" />
        </button>

        <div className="nav-divider" />

        {/* Profile — click to logout */}
        <div
          className="navbar-profile"
          id="navbar-profile-btn"
          onClick={handleLogout}
          title={`${user?.name || 'User'} · Click to logout`}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleLogout()}
        >
          {user?.picture ? (
            <img src={user.picture} alt={user?.name} className="navbar-avatar" />
          ) : (
            <div className="navbar-avatar-placeholder">{initials}</div>
          )}
          <div className="navbar-user-info">
            <span className="navbar-user-name">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <span className={`navbar-user-role ${isAdmin ? 'role-admin-label' : 'role-user-label'}`}>
              {isAdmin ? '⚡ Admin' : '👤 User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
