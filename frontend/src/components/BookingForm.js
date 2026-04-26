import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { useAuth }    from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const pad2 = (n) => String(n).padStart(2, '0');
const toDateValue = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toTimeValue = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const combineLocal = (dateStr, timeStr) => (dateStr && timeStr ? `${dateStr}T${timeStr}:00` : '');
const parseHHMM = (hhmm) => {
  const m = String(hhmm || '').match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
};
const toMinutes = ({ h, min }) => h * 60 + min;
const fromMinutes = (total) => {
  const mins = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  return { h: Math.floor(mins / 60), min: mins % 60 };
};
const roundUpToStep = (minutes, step) => Math.ceil(minutes / step) * step;

const getDefaultTimes = ({ now, stepMinutes = 30, durationMinutes = 60, availability }) => {
  const current = { h: now.getHours(), min: now.getMinutes() };
  let startMin = roundUpToStep(toMinutes(current) + 1, stepMinutes);
  let endMin = startMin + durationMinutes;

  const aStart = parseHHMM(availability?.startTime);
  const aEnd = parseHHMM(availability?.endTime);
  if (aStart && aEnd) {
    const minAStart = toMinutes(aStart);
    const minAEnd = toMinutes(aEnd);

    if (startMin < minAStart) startMin = minAStart;
    if (endMin > minAEnd) endMin = minAEnd;

    // If duration doesn't fit, fall back to last possible slot of the day
    if (startMin >= minAEnd || endMin <= minAStart || startMin >= endMin) {
      endMin = minAEnd;
      startMin = Math.max(minAStart, minAEnd - durationMinutes);
      startMin = roundUpToStep(startMin, stepMinutes);
      if (startMin >= endMin) startMin = minAStart;
    }
  }

  const start = fromMinutes(startMin);
  const end = fromMinutes(endMin);
  return { start: `${pad2(start.h)}:${pad2(start.min)}`, end: `${pad2(end.h)}:${pad2(end.min)}` };
};

const BookingForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [resources,        setResources]        = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [form, setForm] = useState({
    resourceId: '',
    date: toDateValue(new Date()),
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
  });
  const [touchedTimes, setTouchedTimes] = useState({ startTime: false, endTime: false });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    apiService.getResources({ status: 'ACTIVE' })
      .then(res => setResources(res.data))
      .catch(() => {});
  }, []);

  const preselectedResourceId = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return params.get('resourceId') || '';
  }, [location.search]);

  const isResourceLocked = Boolean(preselectedResourceId);

  useEffect(() => {
    if (!preselectedResourceId) return;
    if (!resources?.length) return;
    const match = resources.find(r => r.id === preselectedResourceId);
    if (!match) return;
    setSelectedResource(match);
    setForm((prev) => ({ ...prev, resourceId: preselectedResourceId }));
    setErrors((prev) => ({ ...prev, resourceId: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedResourceId, resources]);

  const validate = () => {
    const e = {};
    const now = new Date();
    if (!form.resourceId) e.resourceId = 'Please select a resource.';
    if (!form.date) e.date = 'Date is required.';
    if (!form.startTime) e.startTime = 'Start time is required.';
    if (!form.endTime) e.endTime = 'End time is required.';

    const startIso = combineLocal(form.date, form.startTime);
    const endIso = combineLocal(form.date, form.endTime);
    if (startIso && new Date(startIso) <= now) e.startTime = 'Start time must be in the future.';
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) e.endTime = 'End time must be after start time.';

    if (!form.purpose.trim()) e.purpose = 'Purpose is required.';
    const n = parseInt(form.attendees);
    if (!form.attendees || isNaN(n) || n < 1) e.attendees = 'Attendees must be at least 1.';
    else if (selectedResource?.capacity && n > selectedResource.capacity) e.attendees = `Exceeds capacity of ${selectedResource.capacity}.`;
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' });
    setApiError(''); setSuccess('');
    if (name === 'resourceId') setSelectedResource(resources.find(r => r.id === value) || null);
    if (name === 'startTime' || name === 'endTime') {
      setTouchedTimes((prev) => ({ ...prev, [name]: true }));
    }
  };

  // Auto-fill times (changeable) — only when user hasn't touched the fields yet.
  useEffect(() => {
    const shouldSetStart = !touchedTimes.startTime && !form.startTime;
    const shouldSetEnd = !touchedTimes.endTime && !form.endTime;
    if (!shouldSetStart && !shouldSetEnd) return;

    // If booking date is today, base on current time; otherwise base on 08:00 (or availability start if present)
    const today = toDateValue(new Date());
    const base = new Date();
    if (form.date && form.date !== today) {
      const aStart = parseHHMM(selectedResource?.availability?.startTime);
      const baseTime = aStart ? aStart : { h: 8, min: 0 };
      base.setHours(baseTime.h, baseTime.min, 0, 0);
    }

    const def = getDefaultTimes({
      now: base,
      availability: selectedResource?.availability,
      stepMinutes: 30,
      durationMinutes: 60,
    });

    setForm((prev) => ({
      ...prev,
      startTime: shouldSetStart ? def.start : prev.startTime,
      endTime: shouldSetEnd ? def.end : prev.endTime,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, selectedResource, touchedTimes.startTime, touchedTimes.endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    setLoading(true); setSuccess(''); setApiError('');
    const startIso = combineLocal(form.date, form.startTime);
    const endIso = combineLocal(form.date, form.endTime);
    try {
      await apiService.createBooking({
        userId: user.userId, resourceId: form.resourceId,
        startTime: startIso,
        endTime: endIso,
        purpose: form.purpose, attendees: parseInt(form.attendees),
      });
      setSuccess('✅ Booking submitted! Your request is now PENDING admin approval. You\'ll be notified once a decision is made.');
      setForm({
        resourceId: isResourceLocked ? preselectedResourceId : '',
        date: toDateValue(new Date()),
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: '',
      });
      setTouchedTimes({ startTime: false, endTime: false });
      if (!isResourceLocked) setSelectedResource(null);
      setErrors({});
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startIso = combineLocal(form.date, form.startTime);
  const endIso = combineLocal(form.date, form.endTime);
  const isFormValid =
    form.resourceId && form.date && form.startTime && form.endTime && form.purpose.trim() &&
    parseInt(form.attendees) >= 1 &&
    startIso && endIso &&
    new Date(startIso) > new Date() &&
    new Date(endIso) > new Date(startIso);

  const bookableResources = resources.filter(r => r.bookable !== false && r.status !== 'OUT_OF_SERVICE');

  return (
    <>
      {success  && <div className="alert alert-success">{success}</div>}
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <form onSubmit={handleSubmit} className="glass-card">
        {/* Resource selector OR locked resource summary */}
        {!isResourceLocked ? (
          <div className="form-group">
            <label className="form-label">Resource *</label>
            <select name="resourceId" value={form.resourceId} onChange={handleChange} className="form-select">
              <option value="">— Select a bookable resource —</option>
              {bookableResources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.type?.replace(/_/g, ' ')} · 📍 {r.location}
                  {r.capacity ? ` · 👥 ${r.capacity}` : ''}
                </option>
              ))}
            </select>
            {errors.resourceId && <span className="validation-error">{errors.resourceId}</span>}
            {bookableResources.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: 4, display: 'block' }}>
                No active resources available for booking.
              </span>
            )}
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Resource *</label>
            <div style={{
              background: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: 12,
              padding: '12px 14px',
            }}>
              <div style={{ fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
                {selectedResource?.name || 'Selected resource'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span>📍 {selectedResource?.location || '—'}</span>
                {selectedResource?.capacity ? <span>👥 Capacity: {selectedResource.capacity}</span> : null}
                {selectedResource?.type ? <span>{selectedResource.type?.replace(/_/g, ' ')}</span> : null}
              </div>
            </div>
          </div>
        )}

        {/* Capacity info banner */}
        {selectedResource?.capacity && (
          <div style={{
            background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16,
            fontSize: '0.84rem', color: 'var(--primary-light)',
          }}>
            📊 Capacity: <strong>{selectedResource.capacity}</strong> people · 📍 {selectedResource.location}
            {selectedResource.availability?.startTime && (
              <> · 🕐 {selectedResource.availability.startTime} – {selectedResource.availability.endTime}</>
            )}
          </div>
        )}

        {/* Date */}
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="form-input"
            min={toDateValue(new Date())}
            id="booking-date"
          />
          {errors.date && <span className="validation-error">{errors.date}</span>}
        </div>

        {/* Start / End time */}
        <div className="two-col">
          <div className="form-group">
            <label className="form-label">Start Time *</label>
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              className="form-input"
              id="booking-start-time"
            />
            {errors.startTime && <span className="validation-error">{errors.startTime}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">End Time *</label>
            <input
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              className="form-input"
              min={form.startTime || undefined}
              id="booking-end-time"
            />
            {errors.endTime && <span className="validation-error">{errors.endTime}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Purpose *</label>
          <input type="text" name="purpose" value={form.purpose} onChange={handleChange}
            className="form-input" placeholder="e.g. Team meeting, Lecture, Lab session" id="booking-purpose" />
          {errors.purpose && <span className="validation-error">{errors.purpose}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Number of Attendees *</label>
          <input type="number" name="attendees" value={form.attendees} onChange={handleChange}
            className="form-input" placeholder="e.g. 15" min="1"
            max={selectedResource?.capacity || undefined} id="booking-attendees" />
          {errors.attendees && <span className="validation-error">{errors.attendees}</span>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isFormValid || loading}
          style={{ width: '100%', padding: '12px' }}
          id="booking-submit-btn"
        >
          {loading ? (
            <>
              <span className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block' }} />
              Submitting…
            </>
          ) : '📤 Submit Booking Request'}
        </button>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
          Bookings require admin approval · You'll receive a notification once reviewed
        </p>
      </form>
    </>
  );
};

export default BookingForm;
