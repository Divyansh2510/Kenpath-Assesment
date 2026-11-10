/**
 * Navigation bar component — glassmorphism-inspired design.
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const toggleUserDropdown = () => setUserDropdownOpen((prev) => !prev);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/reports', label: 'Reports' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">🩸</span>
          <span className="navbar-logo-text">Sweety</span>
        </Link>

        {/* Desktop nav links */}
        <div className={`navbar-links${menuOpen ? ' navbar-links--open' : ''}`}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`navbar-link${location.pathname === to ? ' navbar-link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User section */}
        <div className="navbar-user" ref={userDropdownRef}>
          <button
            className="navbar-avatar-btn"
            onClick={toggleUserDropdown}
            aria-expanded={userDropdownOpen}
            aria-haspopup="true"
          >
            <span className="navbar-avatar">{initial}</span>
            <span className="navbar-username">{user?.name}</span>
            <span className={`navbar-caret${userDropdownOpen ? ' navbar-caret--open' : ''}`} />
          </button>

          {userDropdownOpen && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <span className="navbar-dropdown-name">{user?.name}</span>
                <span className="navbar-dropdown-email">{user?.email}</span>
              </div>
              <div className="navbar-dropdown-divider" />
              <button className="navbar-dropdown-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Hamburger toggle (mobile) */}
        <button
          className={`navbar-hamburger${menuOpen ? ' navbar-hamburger--open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className="navbar-hamburger-line" />
          <span className="navbar-hamburger-line" />
          <span className="navbar-hamburger-line" />
        </button>
      </div>
    </nav>
  );
}
