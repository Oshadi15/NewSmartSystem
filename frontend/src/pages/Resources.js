import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './Resources.css';

const toLabel = (value) => value?.replaceAll('_', ' ') || '—';
const normalizeTime = (value) => (value ? String(value).slice(0, 5) : '');

const Resources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [minCapacity, setMinCapacity] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getResources();
      setResources(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const types = useMemo(() => {
    const distinct = new Set((resources || []).map((r) => r.type).filter(Boolean));
    return ['ALL', ...Array.from(distinct).sort()];
  }, [resources]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minCap = minCapacity === '' ? null : Number(minCapacity);

    return (resources || []).filter((r) => {
      if (q) {
        const hay = `${r.name || ''} ${r.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type !== 'ALL' && r.type !== type) return false;
      if (status !== 'ALL' && r.status !== status) return false;
      if (minCap !== null && Number.isFinite(minCap)) {
        const cap = r.capacity == null ? 0 : Number(r.capacity);
        if (cap < minCap) return false;
      }
      return true;
    });
  }, [resources, search, status, type, minCapacity]);

  const activeCount = useMemo(
    () => (filtered || []).filter((r) => r.status === 'ACTIVE').length,
    [filtered]
  );

  const handleBookNow = (resourceId) => {
    navigate(`/booking?resourceId=${encodeURIComponent(resourceId)}`);
  };

  return (
    <div className="resources-page">
      <div className="page-header">
        <h1 className="page-title">Campus Resources</h1>
        <p className="page-subtitle">
          {loading ? 'Loading...' : `${filtered.length} results · ${activeCount} active`}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="resources-filters">
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            className="filter-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or location..."
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Types' : toLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of service</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Min Capacity</label>
          <input
            className="filter-input"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="e.g. 30"
            inputMode="numeric"
          />
        </div>

        <div className="filter-actions">
          <button className="filter-refresh" onClick={load} disabled={loading}>
            ⟲ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="resources-loading">Loading resources...</div>
      ) : (
        <div className="resources-grid" role="list">
          {filtered.map((r) => {
            const isActive = r.status === 'ACTIVE';
            return (
              <div className="resource-card" key={r.id} role="listitem">
                <div className="resource-card-top">
                  <span className={`resource-type-badge type-${String(r.type || '').toLowerCase()}`}>
                    {toLabel(r.type)}
                  </span>
                  <span className={`resource-status ${isActive ? 'active' : 'inactive'}`}>
                    <span className="status-dot" />
                    {isActive ? 'Active' : 'Out of service'}
                  </span>
                </div>

                <div className="resource-name">{r.name || '—'}</div>

                <div className="resource-meta">
                  <div className="meta-row" title={r.location || ''}>
                    <span className="meta-icon">📍</span>
                    <span className="meta-text">{r.location || '—'}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-icon">👥</span>
                    <span className="meta-text">Capacity: {r.capacity ?? '—'}</span>
                  </div>
                  {r.availability?.startTime && r.availability?.endTime && (
                    <div className="meta-row">
                      <span className="meta-icon">🕐</span>
                      <span className="meta-text">
                        {normalizeTime(r.availability.startTime)} - {normalizeTime(r.availability.endTime)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  className="resource-book-btn"
                  onClick={() => handleBookNow(r.id)}
                  disabled={!isActive}
                  title={!isActive ? 'This resource is not currently active.' : 'Book this resource.'}
                >
                  🗓️ Book Now
                </button>
              </div>
            );
          })}

          {!filtered.length && (
            <div className="resources-empty">
              No resources match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Resources;
