import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuth }    from '../contexts/AuthContext';

const TicketForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    category: '', priority: '', description: '', resourceId: '',
  });
  const [files,    setFiles]    = useState([]);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    apiService.getResources()
      .then(res => setResources(res.data))
      .catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.category)           e.category    = 'Category is required.';
    if (!form.priority)           e.priority    = 'Priority is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (files.length > 3)         e.files       = 'Maximum 3 images allowed.';
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 3) { setErrors({ ...errors, files: 'Maximum 3 images allowed.' }); return; }
    setFiles(selected);
    setErrors({ ...errors, files: '' });
  };

  const handleRemoveFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    setLoading(true);
    try {
      const res = await apiService.createTicket({
        reporterId:  user.userId,
        category:    form.category,
        priority:    form.priority,
        description: form.description,
        ...(form.resourceId ? { resourceId: form.resourceId } : {}),
      });

      if (files.length > 0 && res.data?.id) {
        for (const file of files) {
          await apiService.uploadTicketAttachment(res.data.id, file);
        }
      }

      setForm({ category: '', priority: '', description: '', resourceId: '' });
      setFiles([]); setErrors({});
      if (fileRef.current) fileRef.current.value = '';
      if (onSuccess) onSuccess();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = form.category && form.priority && form.description.trim();

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
        🎫 Submit New Ticket
      </h3>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      {/* Category & Priority */}
      <div className="two-col">
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select name="category" value={form.category} onChange={handleChange} className="form-select" id="ticket-category">
            <option value="">Select category…</option>
            <option value="MAINTENANCE">🔨 Maintenance</option>
            <option value="IT_SUPPORT">💻 IT Support</option>
            <option value="CLEANING">🧹 Cleaning</option>
            <option value="SECURITY">🔐 Security</option>
            <option value="OTHER">📌 Other</option>
          </select>
          {errors.category && <span className="validation-error">{errors.category}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Priority *</label>
          <select name="priority" value={form.priority} onChange={handleChange} className="form-select" id="ticket-priority">
            <option value="">Select priority…</option>
            <option value="LOW">🟢 Low</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="HIGH">🔴 High</option>
            <option value="CRITICAL">🟣 Critical</option>
          </select>
          {errors.priority && <span className="validation-error">{errors.priority}</span>}
        </div>
      </div>

      {/* Affected resource */}
      <div className="form-group">
        <label className="form-label">Affected Resource <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
        <select name="resourceId" value={form.resourceId} onChange={handleChange} className="form-select" id="ticket-resource">
          <option value="">— None / Not applicable —</option>
          {resources.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.type?.replace(/_/g,' ')}) — {r.location}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="form-textarea"
          rows={4}
          placeholder="Describe the issue in detail — what happened, where, when…"
          id="ticket-description"
        />
        {errors.description && <span className="validation-error">{errors.description}</span>}
      </div>

      {/* Attachments */}
      <div className="form-group">
        <label className="form-label">📷 Attachments <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional, max 3 images)</span></label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          id="ticket-attachments"
          style={{
            display: 'block', padding: '10px 14px',
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            width: '100%', cursor: 'pointer',
            background: 'var(--glass-bg)',
            color: 'var(--text-secondary)',
            fontSize: '0.84rem',
          }}
        />
        {errors.files && <span className="validation-error">{errors.files}</span>}

        {/* Preview thumbnails */}
        {files.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {files.map((file, i) => (
              <div key={i} style={{ position: 'relative', display: 'inline-block', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`preview-${i}`}
                  style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFile(i)}
                  style={{
                    position: 'absolute', top: 3, right: 3,
                    background: 'rgba(0,0,0,0.75)', color: 'white',
                    border: 'none', borderRadius: '50%',
                    width: 20, height: 20, cursor: 'pointer',
                    fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!isFormValid || loading}
        style={{ width: '100%', padding: '12px' }}
        id="ticket-submit-btn"
      >
        {loading ? (
          <>
            <span className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block' }} />
            Submitting…
          </>
        ) : '📤 Submit Ticket'}
      </button>
    </form>
  );
};

export default TicketForm;
