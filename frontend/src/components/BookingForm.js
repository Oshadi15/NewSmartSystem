import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth }    from '../contexts/AuthContext';

const BookingForm = () => {
  const { user } = useAuth();
  const [resources,        setResources]        = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [form, setForm] = useState({
    resourceId: '', startTime: '', endTime: '', purpose: '', attendees: '',
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    apiService.getResources({ status: 'ACTIVE' })
      .then(res => setResources(res.data))
      .catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    const now = new Date();
    if (!form.resourceId) e.resourceId = 'Please select a resource.';
    if (!form.startTime)  e.startTime  = 'Start time is required.';
    else if (new Date(form.startTime) <= now) e.startTime = 'Start time must be in the future.';
    if (!form.endTime) e.endTime = 'End time is required.';
    else if (form.startTime && new Date(form.endTime) <= new Date(form.startTime)) e.endTime = 'End time must be after start time.';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    setLoading(true); setSuccess(''); setApiError('');
    try {
      await apiService.createBooking({
        userId: user.userId, resourceId: form.resourceId,
        startTime: form.startTime, endTime: form.endTime,
        purpose: form.purpose, attendees: parseInt(form.attendees),
      });
      setSuccess('✅ Booking submitted! Your request is now PENDING admin approval. You\'ll be notified once a decision is made.');
      setForm({ resourceId: '', startTime: '', endTime: '', purpose: '', attendees: '' });
      setSelectedResource(null); setErrors({});
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    form.resourceId && form.startTime && form.endTime && form.purpose.trim() &&
    parseInt(form.attendees) >= 1 &&
    new Date(form.startTime) > new Date() &&
    new Date(form.endTime) > new Date(form.startTime);

  const bookableResources = resources.filter(r => r.bookable !== false && r.status !== 'OUT_OF_SERVICE');

  return (
    <>
      {success  && <div className="alert alert-success">{success}</div>}
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <form onSubmit={handleSubmit} className="glass-card">
        {/* Resource selector */}
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

        {/* Date & time row */}
        <div className="two-col">
          <div className="form-group">
            <label className="form-label">Start Date &amp; Time *</label>
            <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange}
              className="form-input" min={new Date().toISOString().slice(0, 16)} id="booking-start-time" />
            {errors.startTime && <span className="validation-error">{errors.startTime}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">End Date &amp; Time *</label>
            <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange}
              className="form-input" min={form.startTime || new Date().toISOString().slice(0, 16)} id="booking-end-time" />
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
