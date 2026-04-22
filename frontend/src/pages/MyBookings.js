import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuth }    from '../contexts/AuthContext';
import BookingList    from '../components/BookingList';

const STATUS_COUNTS_META = [
  { key: 'PENDING',   label: 'Pending',   cls: 'badge-pending'  },
  { key: 'APPROVED',  label: 'Approved',  cls: 'badge-approved' },
  { key: 'REJECTED',  label: 'Rejected',  cls: 'badge-rejected' },
  { key: 'CANCELLED', label: 'Cancelled', cls: 'badge-cancelled' },
];

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [message,      setMessage]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const res = await apiService.getUserBookings(user.userId);
      setBookings(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(''), 4000); return () => clearTimeout(t); } }, [message]);
  useEffect(() => { if (error)   { const t = setTimeout(() => setError(''),   6000); return () => clearTimeout(t); } }, [error]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setError('');
    try {
      await apiService.cancelBooking(id);
      setMessage('✅ Booking cancelled successfully.');
      fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});
  const filtered = statusFilter ? bookings.filter(b => b.status === statusFilter) : bookings;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">📅 My Bookings</h1>
        <p className="page-subtitle">
          Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.name || user?.email}</strong>
        </p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* Summary pills as filter toggles */}
      {bookings.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          <button
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('')}
          >
            All <span style={{ opacity: 0.7, marginLeft: 4 }}>({bookings.length})</span>
          </button>
          {STATUS_COUNTS_META.map(s => counts[s.key] ? (
            <button
              key={s.key}
              className={`btn btn-sm ${statusFilter === s.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}
            >
              <span className={`badge ${s.cls}`} style={{ pointerEvents: 'none' }}>{s.label}</span>
              <span style={{ fontWeight: 700 }}>{counts[s.key]}</span>
            </button>
          ) : null)}
        </div>
      )}

      {/* Bookings list / skeleton / empty */}
      {loading ? (
        <div className="table-wrap">
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[90, 75, 85, 70].map((w, i) => (
              <div key={i} className="skeleton skel-text" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No bookings yet. Head to <strong>Book a Resource</strong> to get started.</p>
          </div>
        </div>
      ) : (
        <BookingList bookings={filtered} onCancel={handleCancel} showActions />
      )}
    </>
  );
};

export default MyBookings;
