import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import './ResourceManager.css';

const RESOURCE_TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const RESOURCE_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE'];
const DEFAULT_FORM = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  availabilityWindow: '08:00-18:00',
  status: 'ACTIVE',
};

const normalizeTime = (value) => (value ? String(value).slice(0, 5) : '');
const toLabel = (value) => value?.replaceAll('_', ' ') || '—';
const parseAvailabilityWindow = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  const startTime = `${match[1]}:${match[2]}`;
  const endTime = `${match[3]}:${match[4]}`;
  return { startTime, endTime };
};

const ResourceManager = () => {
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(DEFAULT_FORM);

  const clearAlerts = () => {
    setError('');
    setMessage('');
  };

  const load = async () => {
    try {
      const res = await apiService.getResources();
      setResources(res.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (resource) => {
    const next = resource.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    try {
      clearAlerts();
      await apiService.setResourceStatus(resource.id, next);
      setMessage(`Updated "${resource.name}" to ${next}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (targetForm) => {
    if (!targetForm.name.trim()) return 'Resource name is required.';
    if (!targetForm.location.trim()) return 'Location is required.';
    if (!targetForm.type) return 'Resource type is required.';
    if (targetForm.type !== 'EQUIPMENT') {
      const cap = Number(targetForm.capacity);
      if (!Number.isInteger(cap) || cap < 1) {
        return 'Capacity must be at least 1 for non-equipment resources.';
      }
    }
    const parsedWindow = parseAvailabilityWindow(targetForm.availabilityWindow);
    if (!parsedWindow) {
      return 'Availability window must be like 08:00-18:00.';
    }
    if (parsedWindow.startTime >= parsedWindow.endTime) {
      return 'Availability start time must be before end time.';
    }
    return '';
  };

  const buildPayload = (targetForm) => {
    const payload = {
      name: targetForm.name.trim(),
      type: targetForm.type,
      location: targetForm.location.trim(),
      status: targetForm.status,
    };

    if (targetForm.type !== 'EQUIPMENT') {
      payload.capacity = Number(targetForm.capacity);
    }

    const parsedWindow = parseAvailabilityWindow(targetForm.availabilityWindow);
    payload.availability = parsedWindow;

    return payload;
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      await apiService.createResource(buildPayload(form));
      setMessage('Resource created successfully.');
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (resource) => {
    clearAlerts();
    setEditingId(resource.id);
    setEditForm({
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      capacity: resource.capacity ?? '',
      location: resource.location || '',
      availabilityWindow: `${normalizeTime(resource.availability?.startTime) || '08:00'}-${normalizeTime(resource.availability?.endTime) || '18:00'}`,
      status: resource.status || 'ACTIVE',
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditForm(DEFAULT_FORM);
  };

  const handleUpdate = async (id) => {
    clearAlerts();
    const validationError = validate(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUpdating(true);
      await apiService.updateResource(id, buildPayload(editForm));
      setMessage('Resource updated successfully.');
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (resource) => {
    const ok = window.confirm(`Delete "${resource.name}" permanently?`);
    if (!ok) return;

    clearAlerts();
    try {
      await apiService.deleteResource(resource.id);
      setMessage(`Deleted "${resource.name}".`);
      if (editingId === resource.id) cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="resource-manager-page">
      <div className="page-header">
        <h1 className="page-title">Manage Resources</h1>
        <p className="page-subtitle">Admin panel to add resources and manage availability.</p>
      </div>

      <form className="resource-form" onSubmit={handleSubmit}>
        <h2 className="resource-form-title">Create Resource</h2>
        <p className="resource-form-subtitle">Add a new campus resource to the system.</p>
        <div className="resource-form-grid">
          <div className="form-group">
            <label htmlFor="resource-name" className="form-label">Name *</label>
            <input
              id="resource-name"
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={60}
              placeholder="Resource name"
            />
            <small className="input-help">Maximum 60 characters.</small>
          </div>

          <div className="form-group">
            <label htmlFor="resource-capacity" className="form-label">
              Capacity *
            </label>
            <input
              id="resource-capacity"
              className="form-input"
              type="number"
              min="1"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              placeholder="e.g. 120"
              disabled={form.type === 'EQUIPMENT'}
            />
            <small className="input-help">Use a positive whole number.</small>
          </div>

          <div className="form-group">
            <label htmlFor="resource-location" className="form-label">Location *</label>
            <input
              id="resource-location"
              className="form-input"
              name="location"
              value={form.location}
              onChange={handleChange}
              maxLength={80}
              placeholder="Building / Room"
            />
            <small className="input-help">Maximum 80 characters.</small>
          </div>

          <div className="form-group">
            <label htmlFor="resource-availability-window" className="form-label">Availability Window *</label>
            <input
              id="resource-availability-window"
              className="form-input"
              name="availabilityWindow"
              value={form.availabilityWindow}
              onChange={handleChange}
              placeholder="08:00-18:00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="resource-type" className="form-label">Type *</label>
            <select
              id="resource-type"
              className="form-select"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>{toLabel(type)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="resource-status" className="form-label">Status *</label>
            <select
              id="resource-status"
              className="form-select"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              {RESOURCE_STATUSES.map((status) => (
                <option key={status} value={status}>{toLabel(status)}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Creating...' : 'Add Resource'}
        </button>
      </form>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Location</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                {editingId === r.id ? (
                  <>
                    <td><input className="form-input form-input-sm" name="name" value={editForm.name} onChange={handleEditChange} /></td>
                    <td>
                      <select className="form-select form-input-sm" name="type" value={editForm.type} onChange={handleEditChange}>
                        {RESOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-input form-input-sm"
                        type="number"
                        min="1"
                        name="capacity"
                        value={editForm.capacity}
                        onChange={handleEditChange}
                        disabled={editForm.type === 'EQUIPMENT'}
                      />
                    </td>
                    <td><input className="form-input form-input-sm" name="location" value={editForm.location} onChange={handleEditChange} /></td>
                    <td>
                      <input
                        className="form-input form-input-sm"
                        name="availabilityWindow"
                        value={editForm.availabilityWindow}
                        onChange={handleEditChange}
                        placeholder="08:00-18:00"
                      />
                    </td>
                    <td>
                      <select className="form-select form-input-sm" name="status" value={editForm.status} onChange={handleEditChange}>
                        {RESOURCE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="resource-actions">
                        <button className="btn btn-success btn-xs" onClick={() => handleUpdate(r.id)} disabled={updating}>
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn btn-ghost btn-xs" onClick={cancelEdit} disabled={updating}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r.name}</td>
                    <td>{toLabel(r.type)}</td>
                    <td>{r.capacity ?? '—'}</td>
                    <td>{r.location}</td>
                    <td>
                      {r.availability?.startTime && r.availability?.endTime
                        ? `${normalizeTime(r.availability.startTime)} - ${normalizeTime(r.availability.endTime)}`
                        : 'Unrestricted'}
                    </td>
                    <td>{toLabel(r.status)}</td>
                    <td>
                      <div className="resource-actions">
                        <button className="btn btn-ghost btn-xs" onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button className="btn btn-warning btn-xs" onClick={() => toggleStatus(r)}>
                          Toggle
                        </button>
                        <button className="btn btn-danger btn-xs" onClick={() => handleDelete(r)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceManager;
