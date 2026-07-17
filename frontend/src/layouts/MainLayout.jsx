import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userAvatar, setUserAvatar] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Fetch notifications count and avatar on load
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const notifRes = await api.get('/notifications');
        const unread = notifRes.data.filter((n) => !n.isRead).length;
        setUnreadNotifications(unread);

        const profileRes = await api.get('/profile/me');
        setUserAvatar(profileRes.data.avatar || '');
      } catch (err) {
        console.error('Failed to load header details:', err);
      }
    };

    if (user) {
      fetchHeaderData();
    }
  }, [user]);

  // Hook real-time socket events for notifications incrementing
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification) => {
        setUnreadNotifications((prev) => prev + 1);
      };

      socket.on('receive_notification', handleNewNotification);

      return () => {
        socket.off('receive_notification', handleNewNotification);
      };
    }
  }, [socket]);

  // Reset notifications badge count if we visit notifications page
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadNotifications(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Feed', icon: Home },
    { to: '/network', label: 'Network', icon: Users },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/notifications', label: 'Notifications', icon: Bell, badgeCount: unreadNotifications },
    { to: `/profile/me`, label: 'Profile', icon: UserIcon }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Navigation Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 99,
          height: '64px',
          backgroundColor: 'rgba(18, 19, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.8px'
            }}
          >
            InternLink
          </Link>

          {/* Quick Search Bar */}
          <div
            className="search-container"
            style={{
              position: 'relative',
              maxWidth: '300px',
              width: '100%',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Search
              size={18}
              style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search posts, jobs..."
              onClick={() => navigate('/jobs')}
              style={{
                width: '100%',
                padding: '8px 12px 8px 38px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* User Dropdown controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="avatar"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="profile-name-header" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {user?.name}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>

            {showProfileDropdown && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: '180px',
                  padding: '8px',
                  zIndex: 100,
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Link
                  to="/profile/me"
                  onClick={() => setShowProfileDropdown(false)}
                  style={{
                    display: 'block',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--danger)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Wrapper Layout */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Left Sidebar Menu */}
        <aside
          className="sidebar-left"
          style={{
            width: '240px',
            borderRight: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px 16px',
            position: 'sticky',
            top: '64px',
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </div>
                  {link.badgeCount > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--danger)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        minWidth: '18px',
                        textAlign: 'center'
                      }}
                    >
                      {link.badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Stats or Footer notes */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              © 2026 InternLink Inc.
            </span>
          </div>
        </aside>

        {/* Content Panel */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
          <div className="content-wrapper">{children}</div>
        </main>
      </div>

      {/* CSS overrides for responsive layouts */}
      <style>{`
        .sidebar-link:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary) !important;
        }
        .sidebar-link.active {
          background-color: var(--primary-light);
          color: var(--primary) !important;
          font-weight: 600;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .sidebar-left {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 60px !important;
            width: 100% !important;
            border-right: none !important;
            border-top: 1px solid var(--border-color) !important;
            padding: 0 !important;
            flex-direction: row !important;
            justify-content: space-around !important;
            align-items: center !important;
            z-index: 1000 !important;
            top: auto !important;
          }
          .sidebar-left nav {
            flex-direction: row !important;
            width: 100% !important;
            justify-content: space-around !important;
            gap: 0 !important;
          }
          .sidebar-link {
            padding: 8px !important;
            flex-direction: column !important;
            align-items: center !important;
            font-size: 0.7rem !important;
            gap: 4px !important;
            color: var(--text-muted) !important;
          }
          .sidebar-link div {
            flex-direction: column !important;
            gap: 4px !important;
            align-items: center !important;
          }
          .sidebar-link span {
            display: block !important;
          }
          .sidebar-left div:last-child {
            display: none !important; /* Hide footer */
          }
          .search-container {
            display: none !important; /* Hide search in small header */
          }
          .profile-name-header {
            display: none !important;
          }
          main {
            padding-bottom: 70px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
