import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function parsePercent(resultStr) {
  if (!resultStr) return 0;
  const m = String(resultStr).match(/\d+(?:\.\d+)?/);
  return m ? Math.round(parseFloat(m[0])) : 0;
}

function LineChart({ points }) {
  const width = 640;
  const height = 260;
  const padding = { top: 16, right: 24, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxAttempt = Math.max(1, ...points.map((p) => p.attempt));
  const maxPercent = 100;

  function xScale(v) { return padding.left + (v - 1) * (innerW / Math.max(1, maxAttempt - 1)); }
  function yScale(v) { return padding.top + innerH - (v / maxPercent) * innerH; }

  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.attempt)} ${yScale(p.percent)}`).join(' ')
    : '';

  // X axis ticks per attempt
  const xTicks = Array.from({ length: maxAttempt }, (_, i) => i + 1);
  const yTicks = [0, 20, 40, 60, 80, 100];

  return (
    <svg width={width} height={height} role="img" aria-label="Performance chart">
      <rect x="0" y="0" width={width} height={height} fill="#0b1220" rx="8" />
      {/* grid */}
      {yTicks.map((t, idx) => (
        <line key={`gy-${idx}`} x1={padding.left} y1={yScale(t)} x2={width - padding.right} y2={yScale(t)} stroke="#223049" strokeDasharray="4 4" />
      ))}
      {/* axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#6b7280" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#6b7280" />
      {/* y labels */}
      {yTicks.map((t, idx) => (
        <text key={`yl-${idx}`} x={padding.left - 8} y={yScale(t)} fill="#9ca3af" fontSize="10" textAnchor="end" dominantBaseline="central">{t}%</text>
      ))}
      {/* x labels */}
      {xTicks.map((t, idx) => (
        <text key={`xl-${idx}`} x={xScale(t)} y={height - padding.bottom + 14} fill="#9ca3af" fontSize="10" textAnchor="middle">{t}</text>
      ))}
      {/* line */}
      {points.length > 0 && (
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2" />
      )}
      {/* points */}
      {points.map((p, idx) => (
        <circle key={`pt-${idx}`} cx={xScale(p.attempt)} cy={yScale(p.percent)} r="3.5" fill="#22c55e" />
      ))}
      {/* title */}
      <text x={padding.left} y={12} fill="#e5e7eb" fontSize="12" fontWeight="600">Attempts vs Percentage</text>
    </svg>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState([]);

  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        let email = '';
        try {
          const fromQuery = new URLSearchParams(location.search).get('email');
          if (fromQuery) {
            email = fromQuery;
          } else {
            const userRaw = getCookie('bc_user');
            if (userRaw) email = (JSON.parse(userRaw).email) || '';
          }
        } catch (_) {}
        const token = getCookie('bc_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${backendUrl}/api/activity?email=${email}`, { headers });
        if (!res.ok) throw new Error('Failed to load activities');
        const data = await res.json();
        const arr = Array.isArray(data?.activities) ? data.activities : [];
        setActivities(arr);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [backendUrl, location.search]);

  const points = useMemo(() => {
    return activities
      .map((a) => ({ attempt: Number(a.attempt || 0), percent: parsePercent(a.result) }))
      .filter((p) => p.attempt > 0)
      .sort((a, b) => a.attempt - b.attempt);
  }, [activities]);

  return (
    <div>
      <Navigation onLogout={() => navigate('/login')} />
      <main style={{ padding: '16px' }}>
        <h2 style={{ margin: '8px 0 16px 0' }}>Your Performance</h2>
        {loading && <div>Loading…</div>}
        {error && <div style={{ color: '#ef4444' }}>{error}</div>}
        {!loading && !error && (
          <>
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <LineChart points={points} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Attempt</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Result</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a._id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{a.attempt}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{a.result}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


