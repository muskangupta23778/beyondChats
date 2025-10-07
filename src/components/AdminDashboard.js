import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const token = getCookie('bc_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${backendUrl}/apiAdmin/admin/activities`, { headers });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setActivities(Array.isArray(data?.activities) ? data.activities : []);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [backendUrl]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activities;
    return activities.filter(a =>
      String(a.email || '').toLowerCase().includes(q) ||
      String(a.result || '').toLowerCase().includes(q) ||
      String(a.attempt || '').toLowerCase().includes(q)
    );
  }, [search, activities]);

  function openUser(email) {
    navigate(`/user?email=${encodeURIComponent(email)}`);
  }

  return (
    <div>
      <Navigation onLogout={() => navigate('/login')} />
      <main style={{ padding: '16px' }}>
        <h2 style={{ margin: '8px 0 12px 0' }}>All User Activities</h2>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, attempt, result"
            style={{ padding: '8px 12px', width: '100%', maxWidth: '420px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
        </div>
        {loading && <div>Loading…</div>}
        {error && <div style={{ color: '#ef4444' }}>{error}</div>}
        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Attempt</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Result</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a._id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{a.email}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{a.attempt}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{a.result}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{new Date(a.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
                      <button className="secondary-button" onClick={() => openUser(a.email)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}


