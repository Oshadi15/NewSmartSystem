import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const TYPE_LABELS = {
  LECTURE_HALL: { icon: '🏛', label: 'Lecture Hall' },
  LAB:          { icon: '🔬', label: 'Lab' },
  MEETING_ROOM: { icon: '🤝', label: 'Meeting Room' },
  EQUIPMENT:    { icon: '🔧', label: 'Equipment' },
  ROOM:         { icon: '🚪', label: 'Room' },
};

const ResourceCard = ({ resource }) => {
  const navigate   = useNavigate();
  const typeMeta   = TYPE_LABELS[resource.type] || { icon: '🏢', label: resource.type };
  const isActive   = resource.status === 'ACTIVE';
  const availability = resource.availability
    ? `${resource.availability.startTime || '—'} – ${resource.availability.endTime || '—'}`
    : null;

  return (
    <div className="resource-card">
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: isActive ? 'rgba(108,92,231,0.15)' : 'rgba(255,118,117,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', marginBottom: 12,
      }}>
        {typeMeta.icon}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
            {resource.name}
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{typeMeta.label}</span>
        </div>
        <StatusBadge status={isActive ? 'active' : 'oos'} />
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>📍 {resource.location}</span>
        {resource.capacity && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>👥 Capacity: {resource.capacity} people</span>
        )}
        {availability && (
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>🕐 {availability}</span>
        )}
        {resource.createdAt && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Added {new Date(resource.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* CTA button */}
      <button
        className="btn btn-primary btn-sm"
        style={{ width: '100%' }}
        disabled={!isActive}
        onClick={() => navigate('/booking')}
        id={`resource-card-book-${resource.id}`}
      >
        {isActive ? '📅 Book Now' : '🚫 Unavailable'}
      </button>
    </div>
  );
};

export default ResourceCard;
