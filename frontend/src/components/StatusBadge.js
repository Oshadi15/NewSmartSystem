import React from 'react';

/**
 * StatusBadge — renders a colored pill badge based on a status/priority string.
 * Supports booking statuses, ticket statuses, ticket priorities, and resource states.
 */
const StatusBadge = ({ status }) => {
  if (!status) return null;
  const key = status.toLowerCase().replace(/ /g, '_');
  return (
    <span className={`badge badge-${key}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;