import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const cartCount = getCartItemCount();

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🌮</span>
          Base2 Tacos
        </Link>

        <div style={styles.menu}>
          <Link
            to="/menu"
            style={{
              ...styles.menuItem,
              ...(isActive('/menu') && styles.menuItemActive)
            }}
          >
            Menu
          </Link>
          <Link
            to="/location"
            style={{
              ...styles.menuItem,
              ...(isActive('/location') && styles.menuItemActive)
            }}
          >
            Location
          </Link>

          {/* Role-based navigation */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              style={{
                ...styles.menuItem,
                ...(isActive('/admin') && styles.menuItemActive)
              }}
            >
              Admin
            </Link>
          )}
          {isAuthenticated && (user?.role === 'KITCHEN' || user?.role === 'ADMIN') && (
            <Link
              to="/kitchen"
              style={{
                ...styles.menuItem,
                ...(isActive('/kitchen') && styles.menuItemActive)
              }}
            >
              Kitchen
            </Link>
          )}
          {isAuthenticated && !user?.role && (
            <Link
              to="/dashboard"
              style={{
                ...styles.menuItem,
                ...(isActive('/dashboard') && styles.menuItemActive)
              }}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div style={styles.userSection}>
          {cartCount > 0 && (
            <Link to="/cart" style={styles.cartButton}>
              🛒 Cart ({cartCount})
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <div style={styles.userInfo}>
                <img
                  src={user?.picture || 'https://via.placeholder.com/40'}
                  alt="Profile"
                  style={styles.avatar}
                />
                <span style={styles.userName}>{user?.name}</span>
              </div>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/" style={styles.loginButton}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'white',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#667eea',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoIcon: {
    fontSize: '28px'
  },
  menu: {
    display: 'flex',
    gap: '20px'
  },
  menuItem: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  menuItemActive: {
    color: '#667eea',
    background: '#f0f4ff'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #667eea'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  logoutButton: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cartButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    background: '#667eea',
    textDecoration: 'none',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  loginButton: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    background: '#667eea',
    textDecoration: 'none',
    borderRadius: '6px',
    transition: 'all 0.2s'
  }
};

export default Navigation;
