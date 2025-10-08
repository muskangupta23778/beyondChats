import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navigation.css';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export default function Navigation({ onLogout, rightContent }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  let userName = 'User';
  let userEmail = '';
  let role = 'user';
  try {
    const userRaw = getCookie('bc_user');
    if (userRaw) {
      const userObj = JSON.parse(userRaw);
      userName = (userObj && (userObj.name || userObj.email)) || 'User';
      userEmail = (userObj && userObj.email) || '';
      role = (userObj && userObj.role) ? String(userObj.role).toLowerCase() : 'user';
    }
  } catch (_) {}

  const isAdmin = role === 'admin';

  function handleLogout() {
    clearCookie('bc_token');
    clearCookie('bc_user');
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  }

  function handleUserMenuToggle() {
    setIsUserMenuOpen(!isUserMenuOpen);
  }

  function handleMenuToggle() {
    setIsMenuOpen(!isMenuOpen);
  }

  const path = location.pathname || '';
  const isActive = (pathname) => path === pathname;

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Brand */}
        <div className="nav-brand">
          <div className="brand-icon">🚀</div>
          <div className="brand-text">
            <span className="brand-title">BeyondChats</span>
            <span className="brand-subtitle">AI Learning Platform</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-menu desktop-menu">
          {isAdmin ? (
            <Link 
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              to="/admin"
            >
              <span className="nav-icon">👑</span>
              <span>Admin Dashboard</span>
            </Link>
          ) : (
            <Link 
              className={`nav-link ${isActive('/user') ? 'active' : ''}`}
              to="/user"
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </Link>
          )}
        </div>

        {/* User Section */}
        <div className="nav-user-section">
          {rightContent}
          
          {/* User Menu */}
          <div className="user-menu-container">
            <button className="user-menu-trigger" onClick={handleUserMenuToggle}>
              <div className="user-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">{isAdmin ? 'Admin' : 'Student'}</span>
              </div>
              <div className={`dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`}>▼</div>
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="dropdown-details">
                      <div className="dropdown-name">{userName}</div>
                      <div className="dropdown-email">{userEmail}</div>
                      <div className="dropdown-role">{isAdmin ? 'Administrator' : 'Student'}</div>
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-actions">
                  <button className="dropdown-action" onClick={() => navigate('/user')}>
                    <span className="action-icon">👤</span>
                    <span>Profile</span>
                  </button>
                  <button className="dropdown-action" onClick={() => navigate('/uploadPDF')}>
                    <span className="action-icon">📤</span>
                    <span>Upload PDF</span>
                  </button>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-logout" onClick={handleLogout}>
                  <span className="action-icon">🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={handleMenuToggle}>
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            {isAdmin ? (
              <Link 
                className={`mobile-nav-link ${isActive('/admin') ? 'active' : ''}`}
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">👑</span>
                <span>Admin Dashboard</span>
              </Link>
            ) : (
              <Link 
                className={`mobile-nav-link ${isActive('/user') ? 'active' : ''}`}
                to="/user"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">📊</span>
                <span>Dashboard</span>
              </Link>
            )}
            
            <div className="mobile-user-section">
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="mobile-user-details">
                  <div className="mobile-user-name">{userName}</div>
                  <div className="mobile-user-email">{userEmail}</div>
                </div>
              </div>
              <button 
                className="mobile-logout-btn" 
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                <span className="action-icon">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
}


