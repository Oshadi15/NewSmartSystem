import React from 'react';
import StatusBadge from './StatusBadge';

const fmt = (dt) => dt ? new Date(dt).toLocaleString(undefined, {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
}) : '—';

const BookingList = ({ bookings, onCancel, onApprove, onReject, showActions }) => {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="glass-card">
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p className="empty-text">No bookings found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Purpose</th>
            <th>Date &amp; Time</th>
            <th>Attendees</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              {/* Resource */}
              <td>
                <strong>{b.resourceName || '—'}</strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                  #{b.resourceId?.slice(-8)}
                </div>
              </td>

              {/* Purpose */}
              <td style={{ maxWidth: 200 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.purpose}</span>
              </td>

              {/* Time range */}
              <td style={{ whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '0.82rem' }}>{fmt(b.startTime)}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>→ {fmt(b.endTime)}</div>
              </td>

              {/* Attendees */}
              <td style={{ textAlign: 'center' }}>
                {b.attendees ?? '—'}
              </td>

              {/* Status */}
              <td>
                <StatusBadge status={b.status} />
                {b.rejectionReason && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 4 }}>
                    Reason: {b.rejectionReason}
                  </div>
                )}
              </td>

              {/* Actions */}
              {showActions && (
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {onApprove && b.status === 'PENDING' && (
                      <button
                        className="btn btn-success btn-xs"
                        onClick={() => onApprove(b.id)}
                        id={`approve-booking-${b.id}`}
                      >
                        ✓ Approve
                      </button>
                    )}
                    {onReject && b.status === 'PENDING' && (
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => onReject(b.id)}
                        id={`reject-booking-${b.id}`}
                      >
                        ✕ Reject
                      </button>
                    )}
                    {onCancel && (b.status === 'PENDING' || b.status === 'APPROVED') && (
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => onCancel(b.id)}
                        id={`cancel-booking-${b.id}`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingList;
