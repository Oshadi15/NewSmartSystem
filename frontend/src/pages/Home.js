import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Welcome</h1>
        <p className="page-subtitle">
          Hello {user?.name || 'User'}! Use the sidebar to manage bookings, tickets, notifications, and admin tools.
        </p>
      </div>
      <div className="glass-card">
        <p style={{ margin: 0 }}>Smart Campus Operations Hub is connected and ready.</p>
      </div>
    </>
  );
};

export default Home;
