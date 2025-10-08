import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import './Dashboard.css';

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

  const stats = useMemo(() => {
    const totalUsers = new Set(activities.map(a => a.email)).size;
    const totalAttempts = activities.length;
    const avgScore = totalAttempts > 0 
      ? Math.round(activities.reduce((sum, a) => {
          const percent = String(a.result).match(/\d+(?:\.\d+)?/);
          return sum + (percent ? parseFloat(percent[0]) : 0);
        }, 0) / totalAttempts)
      : 0;
    const recentActivities = activities.filter(a => {
      const daysDiff = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    return { totalUsers, totalAttempts, avgScore, recentActivities };
  }, [activities]);

  return (
    <div className="dashboard-page">
      <Navigation onLogout={() => navigate('/login')} />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-title-section">
            <h1 className="dashboard-title">👑 Admin Dashboard</h1>
            <p className="dashboard-subtitle">Monitor all user activities and performance metrics</p>
          </div>
          <div className="dashboard-actions">
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              <span>🔄</span>
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="stats-grid">
          <div className="stat-card users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-change">Active learners</div>
            </div>
          </div>
          <div className="stat-card attempts">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Total Attempts</div>
              <div className="stat-value">{stats.totalAttempts}</div>
              <div className="stat-change">All time</div>
            </div>
          </div>
          <div className="stat-card average">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-label">Average Score</div>
              <div className="stat-value">{stats.avgScore}%</div>
              <div className="stat-change">Overall performance</div>
            </div>
          </div>
          <div className="stat-card recent">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-label">This Week</div>
              <div className="stat-value">{stats.recentActivities}</div>
              <div className="stat-change">Recent activities</div>
            </div>
          </div>
        </div>

        <div className="search-section">
          <div className="search-header">
            <h2 className="search-title">🔍 User Activities</h2>
            <p className="search-subtitle">Search and filter through all user activities</p>
          </div>
          <div className="search-controls">
            <div className="search-input-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, attempt, or result..."
                className="search-input"
              />
              {search && (
                <button className="clear-search" onClick={() => setSearch('')}>
                  ✕
                </button>
              )}
            </div>
            <div className="search-stats">
              <span className="total-count">Total: {filtered.length}</span>
              {search && (
                <span className="filtered-count">Filtered: {filtered.length}</span>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading user activities...</p>
          </div>
        )}
        
        {error && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3 className="error-title">Unable to load activities</h3>
              <p className="error-message">{error}</p>
              <button className="retry-btn" onClick={() => window.location.reload()}>
                <span>🔄</span>
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="activities-section">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3 className="empty-title">No activities found</h3>
                <p className="empty-message">
                  {search ? 'Try adjusting your search criteria' : 'No user activities have been recorded yet'}
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-activities-table">
                  <thead>
                    <tr>
                      <th>User Email</th>
                      <th>Attempt #</th>
                      <th>Score</th>
                      <th>Date & Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, idx) => (
                      <tr key={a._id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">{a.email.charAt(0).toUpperCase()}</div>
                            <div className="user-details">
                              <div className="user-email">{a.name}</div>
                              <div className="user-domain">{a.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="attempt-badge">#{a.attempt}</div>
                        </td>
                        <td>
                          <div className={`score-badge ${String(a.result).match(/\d+/)?.[0] >= 80 ? 'excellent' : String(a.result).match(/\d+/)?.[0] >= 60 ? 'good' : 'needs-improvement'}`}>
                            {a.result}
                          </div>
                        </td>
                        <td>
                          <div className="date-info">
                            <div className="date">{new Date(a.createdAt).toLocaleDateString()}</div>
                            <div className="time">{new Date(a.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </td>
                        <td>
                          <button className="view-user-btn" onClick={() => openUser(a.email)}>
                            <span>👁️</span>
                            <span>View Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


