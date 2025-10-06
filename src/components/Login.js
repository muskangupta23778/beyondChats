import React, { useState } from 'react';
import './Login.css';

function Login() {
  const [emailAddress, setEmailAddress] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasEmailError = emailAddress.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);

  function togglePasswordVisibility() {
    setIsPasswordVisible((current) => !current);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!emailAddress || !passwordValue || hasEmailError) return;
    setIsSubmitting(true);
    // Simulate a request for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);
    // In a real app, navigate or show a toast here
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
                <a className="link" href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting || !emailAddress || !passwordValue || hasEmailError}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="divider" role="separator" aria-label="OR" />

              <div className="social-row">
                <button type="button" className="secondary-button" onClick={(e) => e.preventDefault()}>Continue with Google</button>
                <button type="button" className="secondary-button" onClick={(e) => e.preventDefault()}>Continue with GitHub</button>
              </div>

              <p className="aux-text">
                New here? <a className="link" href="#" onClick={(e) => e.preventDefault()}>Create an account</a>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;


