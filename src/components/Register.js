import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'user' })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Registration failed');
      }
      navigate('/');
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="brand-panel" aria-hidden="true">
          <div className="brand-panel-content">
            <div className="brand-badge">BC</div>
            <h2 className="brand-heading">BeyondChats</h2>
            <p className="brand-subtitle">Create your account</p>
          </div>
        </aside>

        <main className="auth-panel" role="main">
          <div className="auth-card" role="region" aria-label="Register form">
            <header className="auth-header">
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">Join BeyondChats</p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {error && <div className="field-error" role="alert">{error}</div>}
              <div className="form-field">
                <label htmlFor="name" className="field-label">Full name</label>
                <input id="name" className="text-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-field">
                <label htmlFor="email" className="field-label">Email address</label>
                <input id="email" type="email" className="text-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-field">
                <label htmlFor="password" className="field-label">Password</label>
                <input id="password" type="password" className="text-input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
              </div>

              <button type="submit" className="primary-button" disabled={submitting || !name || !email || !password}>
                {submitting ? 'Creating…' : 'Create account'}
              </button>

              <p className="aux-text">Already have an account? <a className="link" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Sign in</a></p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}


