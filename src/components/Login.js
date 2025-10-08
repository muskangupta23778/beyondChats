import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const hasEmailError = emailAddress.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);

  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function togglePasswordVisibility() {
    setIsPasswordVisible((current) => !current);
  }

  async function handleSubmit(event) {
    console.log("emailAddress", emailAddress);
    console.log("passwordValue", passwordValue);
    event.preventDefault();
    if (!emailAddress || !passwordValue || hasEmailError) return;
    setIsSubmitting(true);
    setAuthError('');
    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, password: passwordValue })
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Login failed');
      }

      const data = await response.json();
      if (!data || !data.token || !data.user) {
        throw new Error('Unexpected response');
      }

      setCookie('bc_token', data.token, 2);
      setCookie('bc_user', JSON.stringify(data.user), 2);
      const role = String((data.user && data.user.role) || '').toLowerCase();
      navigate(role === 'admin' ? '/admin' : '/user');
    } catch (err) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="brand-panel" aria-hidden="true">
          <div className="brand-panel-content">
            <div className="brand-badge">BC</div>
            <h2 className="brand-heading">BeyondChats</h2>
            <p className="brand-subtitle">Conversations that convert. Insights that delight.</p>
          </div>
        </aside>

        <main className="auth-panel" role="main">
          <div className="auth-card" role="region" aria-label="Login form">
            <header className="auth-header">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to continue</p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {authError && (
                <div className="field-error" role="alert">{authError}</div>
              )}
              <div className="form-field">
                <label htmlFor="email" className="field-label">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`text-input ${hasEmailError ? 'input-error' : ''}`}
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  aria-invalid={hasEmailError}
                  aria-describedby={hasEmailError ? 'email-error' : undefined}
                  required
                />
                {hasEmailError && (
                  <div id="email-error" className="field-error">Enter a valid email.</div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="password" className="field-label">Password</label>
                <div className="password-input-group">
                  <input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your secure password"
                    className="text-input"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={togglePasswordVisibility}
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  >
                    {isPasswordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox">
                  <input type="checkbox" name="remember" />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting || !emailAddress || !passwordValue || hasEmailError}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="divider" role="separator" aria-label="OR" />

              <p className="aux-text">
                New here? <a className="link" href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Create an account</a>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;


