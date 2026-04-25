import React, { useState } from 'react';
import Sidebar from '../pages/Sidebar';

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        <header className="topbar">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setMobileOpen(true)}
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            ☰
          </button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
