import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getResources();
        setResources(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Resources</h1>
        <p className="page-subtitle">Browse campus resources and availability.</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: 16 }}>Loading resources...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.capacity ?? '—'}</td>
                  <td>{r.location}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Resources;
