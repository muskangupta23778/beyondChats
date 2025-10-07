import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export default function Navigation({ onLogout }) {
  const navigate = useNavigate();

  let userName = 'User';
  let role = 'user';
  try {
    const userRaw = getCookie('bc_user');
    if (userRaw) {
      const userObj = JSON.parse(userRaw);
      userName = (userObj && (userObj.name || userObj.email)) || 'User';
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
      navigate('/login');
    }
  }

  // Minimal inline styles for a cleaner, modern navbar
  const styles = {
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
      color: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
    },
    brand: { fontWeight: 700, letterSpacing: '0.3px' },
    menu: { display: 'flex', alignItems: 'center', gap: '12px' },
    link: {
      color: '#fff',
      textDecoration: 'none',
      padding: '8px 12px',
      borderRadius: '999px',
      transition: 'background 0.2s ease',
      background: 'rgba(255,255,255,0.1)'
    },
    userChip: {
      background: 'rgba(255,255,255,0.15)',
      padding: '8px 12px',
      borderRadius: '999px',
      marginRight: '6px'
    },
    logout: {
      border: 'none',
      background: '#ef4444',
      color: '#fff',
      borderRadius: '999px',
      padding: '8px 12px',
      cursor: 'pointer'
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>BeyondChats</div>
      <div style={styles.menu}>
        {isAdmin ? (
          <>
            <Link style={styles.link} to="/admin">Dashboard</Link>
          </>
        ) : (
          <>
            <Link style={styles.link} to="/uploadPDF">Take Test</Link>
            <Link style={styles.link} to="/user">Dashboard</Link>
          </>
        )}
      </div>
      <div style={styles.menu}>
        <span style={styles.userChip}>{userName}</span>
        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}


