import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const ResourceManager = () => {
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');

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
      await apiService.setResourceStatus(resource.id, next);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Manage Resources</h1>
        <p className="page-subtitle">Admin panel to activate/deactivate resource availability.</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td>{r.status}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(r)}>
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ResourceManager;
