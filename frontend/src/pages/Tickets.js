import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuth }    from '../contexts/AuthContext';
import TicketForm     from '../components/TicketForm';
import StatusBadge    from '../components/StatusBadge';

/* ── Constants ─────────────────────────────────────────────── */
const STATUS_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['REJECTED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      [],
  REJECTED:    [],
};
const fmt = (dt) => dt ? new Date(dt).toLocaleString() : '—';

/* ── Tickets Page ──────────────────────────────────────────── */
const Tickets = () => {
  const { user, isAdmin } = useAuth();
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [comment,        setComment]        = useState({});        // ticketId → text
  const [editingComment, setEditingComment] = useState(null);       // {ticketId, commentId, text}
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [filterStatus,   setFilterStatus]   = useState('');
  const [showForm,       setShowForm]       = useState(false);

  const [rejectModal,  setRejectModal]  = useState({ open: false, ticketId: null, reason: '' });
  const [resolveModal, setResolveModal] = useState({ open: false, ticketId: null, notes: '' });

  const fetchTickets = useCallback(async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const res = isAdmin
        ? await apiService.getAllTickets()
        : await apiService.getUserTickets(user.userId);
      setTickets(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.userId]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error)   { const t = setTimeout(() => setError(''),   6000); return () => clearTimeout(t); } }, [error]);

  /* ── Status transitions ── */
  const handleAdvanceStatus = async (ticketId, nextStatus) => {
    try { await apiService.updateTicketStatus(ticketId, nextStatus); setSuccess(`Ticket → ${nextStatus}.`); fetchTickets(); }
    catch (err) { setError(err.message); }
  };
  const handleRejectConfirm = async () => {
    if (!rejectModal.reason.trim()) { setError('Rejection reason is required.'); return; }
    try {
      await apiService.updateTicketStatus(rejectModal.ticketId, 'REJECTED', rejectModal.reason);
      setSuccess('Ticket rejected.'); setRejectModal({ open: false, ticketId: null, reason: '' }); fetchTickets();
    } catch (err) { setError(err.message); }
  };
  const handleResolveConfirm = async () => {
    try {
      await apiService.resolveTicket(resolveModal.ticketId, resolveModal.notes);
      setSuccess('Ticket resolved.'); setResolveModal({ open: false, ticketId: null, notes: '' }); fetchTickets();
    } catch (err) { setError(err.message); }
  };

  /* ── Comments ── */
  const handleAddComment = async (ticketId) => {
    const text = comment[ticketId]?.trim();
    if (!text) return;
    try {
      await apiService.addTicketComment(ticketId, user.userId, text);
      setComment({ ...comment, [ticketId]: '' }); setSuccess('Comment added.'); fetchTickets();
    } catch (err) { setError(err.message); }
  };
  const handleEditComment = async () => {
    if (!editingComment?.text?.trim()) { setError('Comment cannot be empty.'); return; }
    try {
      await apiService.editTicketComment(editingComment.ticketId, editingComment.commentId, editingComment.text);
      setEditingComment(null); setSuccess('Comment updated.'); fetchTickets();
    } catch (err) { setError(err.message); }
  };
  const handleDeleteComment = async (ticketId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try { await apiService.deleteTicketComment(ticketId, commentId); fetchTickets(); }
    catch (err) { setError(err.message); }
  };

  const filtered = filterStatus ? tickets.filter(t => t.status === filterStatus) : tickets;

  return (
    <>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">🎫 Support Tickets</h1>
          <p className="page-subtitle">{isAdmin ? 'Manage all campus support tickets' : 'View and submit campus support tickets'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)} id="toggle-ticket-form-btn">
          {showForm ? '↑ Hide Form' : '+ New Ticket'}
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* Submit form */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: 22 }}>
          <TicketForm onSuccess={() => { setSuccess('✅ Ticket submitted!'); fetchTickets(); setShowForm(false); }} />
        </div>
      )}

      {/* Modals */}
      {rejectModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">❌ Reject Ticket</div>
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea className="form-textarea" rows={3} placeholder="Reason for rejection…"
                value={rejectModal.reason} onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })} autoFocus />
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleRejectConfirm}>Confirm Reject</button>
              <button className="btn btn-ghost"  onClick={() => setRejectModal({ open: false, ticketId: null, reason: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {resolveModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">✅ Resolve Ticket</div>
            <div className="form-group">
              <label className="form-label">Resolution Notes (optional)</label>
              <textarea className="form-textarea" rows={3} placeholder="What was done to fix the issue?"
                value={resolveModal.notes} onChange={e => setResolveModal({ ...resolveModal, notes: e.target.value })} autoFocus />
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleResolveConfirm}>Mark Resolved</button>
              <button className="btn btn-ghost"   onClick={() => setResolveModal({ open: false, ticketId: null, notes: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editingComment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">✏️ Edit Comment</div>
            <textarea className="form-textarea" rows={3}
              value={editingComment.text} onChange={e => setEditingComment({ ...editingComment, text: e.target.value })} autoFocus />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleEditComment}>Save Changes</button>
              <button className="btn btn-ghost"   onClick={() => setEditingComment(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter + list header */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Filter by Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select" style={{ minWidth: 160 }}>
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        {filterStatus && <button className="btn btn-ghost btn-sm" onClick={() => setFilterStatus('')}>✕ Clear</button>}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {filtered.length} of {tickets.length} ticket(s)
        </span>
      </div>

      {/* Ticket cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton skel-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <p className="empty-text">No tickets found{filterStatus ? ` with status "${filterStatus}"` : ''}.</p>
          </div>
        </div>
      ) : (
        <div>
          {filtered.map(ticket => (
            <div key={ticket.id} className="ticket-card">
              {/* Header */}
              <div className="ticket-header">
                <div className="ticket-meta">
                  <StatusBadge status={ticket.priority} />
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{ticket.category}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>#{ticket.id?.slice(-8)}</span>
                  {ticket.resourceName && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>📍 {ticket.resourceName}</span>
                  )}
                </div>
                <StatusBadge status={ticket.status} />
              </div>

              {/* Body */}
              <p className="ticket-body">{ticket.description}</p>

              {/* Rejection reason */}
              {ticket.rejectionReason && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(255,118,117,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                    <strong>Rejection Reason:</strong> {ticket.rejectionReason}
                  </span>
                </div>
              )}
              {ticket.resolutionNotes && (
                <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(0,184,148,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                  <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>
                    <strong>✅ Resolution:</strong> {ticket.resolutionNotes}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="ticket-footer">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  Created {fmt(ticket.createdAt)}
                  {ticket.assignedTo && ' · Assigned ✓'}
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                  >
                    💬 Comments ({ticket.comments?.length || 0})
                  </button>

                  {isAdmin && (STATUS_TRANSITIONS[ticket.status] || []).map(next => (
                    <button
                      key={next}
                      className={`btn btn-sm ${next === 'REJECTED' ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => next === 'REJECTED' ? setRejectModal({ open: true, ticketId: ticket.id, reason: '' }) : handleAdvanceStatus(ticket.id, next)}
                    >
                      → {next.replace('_', ' ')}
                    </button>
                  ))}
                  {isAdmin && ticket.status === 'IN_PROGRESS' && (
                    <button className="btn btn-success btn-sm" onClick={() => setResolveModal({ open: true, ticketId: ticket.id, notes: '' })}>
                      ✅ Resolve
                    </button>
                  )}
                </div>
              </div>

              {/* Comments section */}
              {expandedTicket === ticket.id && (
                <div className="comments-section">
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Comments ({ticket.comments?.length || 0})
                  </p>
                  {ticket.comments?.length > 0 ? ticket.comments.map(c => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-head">
                        <span className="comment-author">{c.authorId === user.userId ? '👤 You' : `User …${c.authorId?.slice(-6)}`}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="comment-time">{fmt(c.createdAt)}</span>
                          {c.authorId === user.userId && (
                            <>
                              <button onClick={() => setEditingComment({ ticketId: ticket.id, commentId: c.id, text: c.content })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-light)', fontSize: '0.78rem' }}>✏️</button>
                              <button onClick={() => handleDeleteComment(ticket.id, c.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.78rem' }}>🗑</button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                  )) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No comments yet. Be the first!</p>
                  )}

                  {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input type="text" className="form-input" style={{ flex: 1 }}
                        placeholder="Write a comment…"
                        value={comment[ticket.id] || ''}
                        onChange={e => setComment({ ...comment, [ticket.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(ticket.id)}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddComment(ticket.id)} disabled={!comment[ticket.id]?.trim()}>
                        Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Tickets;
