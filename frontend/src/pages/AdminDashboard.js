import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuth }    from '../contexts/AuthContext';
import BookingList    from '../components/BookingList';
import StatusBadge    from '../components/StatusBadge';
import './AdminDashboard.css';

/* ── Helpers ───────────────────────────────────────────────── */
const fmt = (dt) => dt ? new Date(dt).toLocaleString() : '—';

const TICKET_STATUS_FLOW = {
  OPEN:        ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      [],
  REJECTED:    [],
};

/* ── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, iconBg, icon }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
    <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{value ?? '…'}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

/* ── Skeleton row ──────────────────────────────────────────── */
const SkeletonRows = ({ n = 4 }) => (
  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="skeleton skel-text" style={{ width: `${75 + (i % 3) * 8}%` }} />
    ))}
  </div>
);

/* ── Admin Dashboard ───────────────────────────────────────── */
const AdminDashboard = () => {
  const { user } = useAuth();
  const [tab,          setTab]          = useState('bookings');
  const [bookings,     setBookings]     = useState([]);
  const [tickets,      setTickets]      = useState([]);
  const [resources,    setResources]    = useState([]);
  const [users,        setUsers]        = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [message,      setMessage]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [rejectModal,  setRejectModal]  = useState({ open: false, id: null, type: '', reason: '' });
  const [userModal,    setUserModal]    = useState({ open: false, name: '', email: '', role: 'USER' });

  const clearAlerts = () => { setError(''); setMessage(''); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bookRes, tickRes, statsRes, userRes, resRes] = await Promise.all([
        apiService.getAllBookings(),
        apiService.getAllTickets(),
        apiService.getAdminStats(),
        apiService.getUsers(),
        apiService.getResources(),
      ]);
      setBookings(bookRes.data);
      setTickets(tickRes.data);
      setStats(statsRes.data);
      setUsers(userRes.data);
      setResources(resRes.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(''), 4000); return () => clearTimeout(t); } }, [message]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await apiService.getAllBookings(
        statusFilter || undefined,
        resourceFilter || undefined
      );
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, [statusFilter, resourceFilter]);

  useEffect(() => {
    if (tab !== 'bookings') return;
    fetchBookings();
  }, [tab, fetchBookings]);

  // Booking actions
  const handleApprove = async (id) => {
    clearAlerts();
    try { await apiService.approveBooking(id); setMessage('✅ Booking approved.'); fetchAll(); }
    catch (err) { setError(err.message); }
  };
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this APPROVED booking?')) return;
    clearAlerts();
    try {
      await apiService.cancelBooking(id);
      setMessage('✅ Booking cancelled.');
      fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };
  const openRejectModal = (id, type = 'booking') =>
    setRejectModal({ open: true, id, type, reason: '' });

  const handleRejectConfirm = async () => {
    if (!rejectModal.reason.trim()) { setError('Please provide a rejection reason.'); return; }
    clearAlerts();
    try {
      if (rejectModal.type === 'booking') {
        await apiService.rejectBooking(rejectModal.id, rejectModal.reason);
        setMessage('Booking rejected.');
      } else {
        await apiService.updateTicketStatus(rejectModal.id, 'REJECTED', rejectModal.reason);
        setMessage('Ticket rejected.');
      }
      setRejectModal({ open: false, id: null, type: '', reason: '' });
      fetchAll();
    } catch (err) { setError(err.message); }
  };

  /* ── Ticket actions ── */
  const handleTicketStatus = async (id, newStatus) => {
    if (newStatus === 'REJECTED') { openRejectModal(id, 'ticket'); return; }
    clearAlerts();
    try { await apiService.updateTicketStatus(id, newStatus); setMessage(`Ticket moved to ${newStatus}.`); fetchAll(); }
    catch (err) { setError(err.message); }
  };
  const handleAssignTicket = async (id) => {
    clearAlerts();
    try { await apiService.assignTicket(id, user.userId); setMessage('Ticket assigned to you.'); fetchAll(); }
    catch (err) { setError(err.message); }
  };

  /* ── User actions ── */
  const handleCreateUser = async () => {
    if (!userModal.name || !userModal.email) { setError('Name and Email are required.'); return; }
    clearAlerts();
    try {
      await apiService.createUser({ name: userModal.name, email: userModal.email, role: userModal.role });
      setMessage('User created successfully.');
      setUserModal({ open: false, name: '', email: '', role: 'USER' });
      fetchAll();
    } catch (err) { setError(err.message); }
  };

  const handleSetRole = async (u, newRole) => {
    clearAlerts();
    try {
      await apiService.updateUserRole(u.id, newRole);
      setMessage(`User role updated to ${newRole}.`);
      fetchAll();
    } catch (err) { setError(err.message); }
  };

  const filteredBookings = statusFilter ? bookings.filter(b => b.status === statusFilter) : bookings;
  const filteredTickets  = statusFilter ? tickets.filter(t => t.status === statusFilter)  : tickets;

  return (
    <div className="admin-dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage bookings, tickets, and monitor system health</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <StatCard label="Total Resources"  value={stats?.totalResources}      icon="🏛"  iconBg="rgba(116,185,255,0.15)" />
        <StatCard label="Total Users"      value={stats?.totalUsers}          icon="👥" iconBg="rgba(108,92,231,0.15)"  />
        <StatCard label="Pending Bookings" value={stats?.bookings?.pending}   icon="📅" iconBg="rgba(253,203,110,0.15)" sub={`${stats?.bookings?.total ?? 0} total bookings`} />
        <StatCard label="Open Tickets"     value={stats?.tickets?.open}       icon="🎫" iconBg="rgba(255,118,117,0.15)" sub={`${stats?.tickets?.total ?? 0} total tickets`} />
        <StatCard label="Resolved Tickets" value={stats?.tickets?.resolved}   icon="✅" iconBg="rgba(0,184,148,0.15)"  />
      </div>

      {/* ── Reject Modal ── */}
      {rejectModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">
              <span>❌</span>
              Reject {rejectModal.type === 'booking' ? 'Booking' : 'Ticket'}
            </div>
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Enter reason for rejection…"
                value={rejectModal.reason}
                onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleRejectConfirm}>Confirm Reject</button>
              <button className="btn btn-ghost" onClick={() => setRejectModal({ open: false, id: null, type: '', reason: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {userModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title"><span>👤</span> Add New User</div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={userModal.name} onChange={e => setUserModal({...userModal, name: e.target.value})} placeholder="Jane Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={userModal.email} onChange={e => setUserModal({...userModal, email: e.target.value})} placeholder="jane@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={userModal.role} onChange={e => setUserModal({...userModal, role: e.target.value})}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleCreateUser}>Create User</button>
              <button className="btn btn-ghost" onClick={() => setUserModal({ open: false, name: '', email: '', role: 'USER' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      {/* ── Tabs ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 22 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab${tab === 'bookings' ? ' active' : ''}`} onClick={() => { setTab('bookings'); setStatusFilter(''); }}>
            📅 Bookings <span className="tab-count">{bookings.length}</span>
          </button>
          <button className={`tab${tab === 'tickets' ? ' active' : ''}`} onClick={() => { setTab('tickets'); setStatusFilter(''); }}>
            🎫 Tickets <span className="tab-count">{tickets.length}</span>
          </button>
          <button className={`tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
            👥 Users <span className="tab-count">{users.length}</span>
          </button>
        </div>
        {tab === 'users' && (
          <button className="btn btn-primary" onClick={() => setUserModal({ open: true, name: '', email: '', role: 'USER' })}>+ Add User</button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      {tab !== 'users' && (
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Filter by Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select" style={{ minWidth: 160 }}>
            <option value="">All Statuses</option>
            {tab === 'bookings' ? (
              <>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </>
            ) : (
              <>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REJECTED">REJECTED</option>
              </>
            )}
          </select>
        </div>

        {tab === 'bookings' && (
          <div className="form-group">
            <label className="form-label">Filter by Resource</label>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="form-select"
              style={{ minWidth: 220 }}
            >
              <option value="">All Resources</option>
              {(resources || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.location}
                </option>
              ))}
            </select>
          </div>
        )}

        {statusFilter && (
          <button className="btn btn-ghost btn-sm" onClick={() => setStatusFilter('')}>✕ Clear</button>
        )}
        {tab === 'bookings' && resourceFilter && (
          <button className="btn btn-ghost btn-sm" onClick={() => setResourceFilter('')}>✕ Clear Resource</button>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {tab === 'bookings' ? filteredBookings.length : filteredTickets.length} result(s)
        </span>
      </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="table-wrap"><SkeletonRows n={5} /></div>
      ) : tab === 'bookings' ? (
        <BookingList
          bookings={filteredBookings}
          onApprove={handleApprove}
          onReject={(id) => openRejectModal(id, 'booking')}
          onCancel={handleCancelBooking}
          showActions
        />
      ) : tab === 'tickets' ? (
        /* ── Ticket Table ── */
        <div className="table-wrap">
          {filteredTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎫</div>
              <p className="empty-text">No tickets found{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Resource</th>
                  <th>Reporter</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>{ticket.category}</strong>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        #{ticket.id?.slice(-8)} · {ticket.description?.substring(0, 55)}{ticket.description?.length > 55 ? '…' : ''}
                      </div>
                    </td>
                    <td><StatusBadge status={ticket.priority} /></td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td>{ticket.resourceName || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>…{ticket.reporterId?.slice(-8)}</td>
                    <td>{fmt(ticket.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!ticket.assignedTo && ticket.status === 'OPEN' && (
                          <button className="btn btn-primary btn-xs" onClick={() => handleAssignTicket(ticket.id)}>Assign Me</button>
                        )}
                        {TICKET_STATUS_FLOW[ticket.status]?.map(next => (
                          <button
                            key={next}
                            className={`btn btn-xs ${next === 'REJECTED' ? 'btn-danger' : next === 'RESOLVED' ? 'btn-success' : 'btn-ghost'}`}
                            onClick={() => handleTicketStatus(ticket.id, next)}
                          >
                            → {next.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                      {ticket.rejectionReason && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 4 }}>Reason: {ticket.rejectionReason}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── Users Table ── */
        <div className="table-wrap">
          {users.length === 0 ? (
            <div className="empty-state"><p className="empty-text">No users found.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={u.picture || 'https://via.placeholder.com/30'} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><StatusBadge status={`ROLE-${u.role}`} /></td>
                    <td>{fmt(u.createdAt)}</td>
                    <td>
                      {u.id !== user.userId && (
                        <select
                          className="form-select"
                          style={{ minWidth: 140 }}
                          value={u.role}
                          onChange={(e) => handleSetRole(u, e.target.value)}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="TECHNICIAN">TECHNICIAN</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
