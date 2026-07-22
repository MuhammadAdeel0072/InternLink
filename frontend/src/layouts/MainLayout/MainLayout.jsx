import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import styles from './MainLayout.module.css';
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
  ChevronDown,
  Settings
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
    <div className={styles.mainLayout}>
      {/* Top Navigation Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            InternLink
          </Link>

          {/* Quick Search Bar */}
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search posts, jobs..."
              onClick={() => navigate('/jobs')}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* User Dropdown controls */}
        <div className={styles.headerRight}>
          <div className={styles.profileDropdownWrapper}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={styles.profileDropdownBtn}
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="avatar"
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className={styles.profileName}>{user?.name}</span>
              <ChevronDown size={14} className={styles.chevronIcon} />
            </button>

            {showProfileDropdown && (
              <div className={`card ${styles.profileDropdown}`}>
                <Link
                  to="/profile/me"
                  onClick={() => setShowProfileDropdown(false)}
                  className={styles.dropdownLink}
                >
                  <UserIcon size={16} />
                  My Profile
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setShowProfileDropdown(false)}
                  className={styles.dropdownLink}
                >
                  ⚙️ Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className={styles.dropdownLogoutBtn}
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
      <div className={styles.mainWrapper}>
        {/* Left Sidebar Menu */}
        <aside className={styles.sidebar}>
          <nav className={styles.sidebarNav}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => 
                    `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
                  }
                >
                  <div className={styles.sidebarLinkContent}>
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </div>
                  {link.badgeCount > 0 && (
                    <span className={styles.badgeCount}>
                      {link.badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Stats or Footer notes */}
          <div className={styles.sidebarFooter}>
            <span className={styles.footerText}>
              © 2026 InternLink Inc.
            </span>
          </div>
        </aside>

        {/* Content Panel */}
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;