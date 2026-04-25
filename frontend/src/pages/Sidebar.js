import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userNav = [
    { path: '/',              icon: '⊞',  label: 'Dashboard',      end: true },
    { path: '/my-bookings',   icon: '📅', label: 'My Bookings' },
    { path: '/resources',     icon: '🏛',  label: 'Resources' },
    { path: '/tickets',       icon: '🎫', label: 'Tickets' },
    { path: '/notifications', icon: '🔔', label: 'Notifications' },
  ];

  const adminNav = [
    { path: '/admin',            icon: '⚡', label: 'Admin Dashboard' },
    { path: '/resources/manage', icon: '🔧', label: 'Manage Resources' },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
      onClick={onMobileClose}
      title={collapsed ? item.label : undefined}
    >
      <span className="sidebar-icon">{item.icon}</span>
      <span className="sidebar-label">{item.label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile dim overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">🏫</div>
          <div className="sidebar-brand-text">
            <h2>Smart Campus</h2>
            <span>Management System</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {userNav.map(item => <NavItem key={item.path} item={item} />)}

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Admin</div>
              {adminNav.map(item => <NavItem key={item.path} item={item} />)}
            </>
          )}
        </nav>

        {/* Footer: Logout + Collapse */}
        <div className="sidebar-footer">
          {/* Logout button */}
          <button
            className={`sidebar-logout${collapsed ? ' collapsed' : ''}`}
            onClick={handleLogout}
            title="Logout"
          >
            <span className="sidebar-logout-icon">🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse toggle */}
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            id="sidebar-toggle-btn"
          >
            {collapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
