import { useState, useRef, useEffect } from 'react';

import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import styles from './MainLayout.module.css';
import {
  Home, Users, Briefcase, MessageSquare, Bell,
  User as UserIcon, LogOut, Search, ChevronDown, Settings,
  X, TrendingUp, Clock, FileText, User // ← ADD THESE
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userAvatar, setUserAvatar] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState(null);
const [showSearchDropdown, setShowSearchDropdown] = useState(false);
const [searchHistory, setSearchHistory] = useState(() => {
  return JSON.parse(localStorage.getItem('searchHistory') || '[]');
});
const searchRef = useRef();
const searchTimeout = useRef();
const [showMobileSearch, setShowMobileSearch] = useState(false);
// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowSearchDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

const handleSearch = (query) => {
  setSearchQuery(query);
  
  if (searchTimeout.current) clearTimeout(searchTimeout.current);
  
  if (query.length < 2) {
    setSearchResults(null);
    return;
  }

  searchTimeout.current = setTimeout(async () => {
    try {
      const res = await api.get(`/search?q=${query}`);
      setSearchResults(res.data);
      setShowSearchDropdown(true);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, 300);
};

const handleSearchSubmit = (e) => {
  e.preventDefault();
  if (!searchQuery.trim()) return;
  
  // Save to history
  const updatedHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
  setSearchHistory(updatedHistory);
  localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  
  setShowSearchDropdown(false);
  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
};

const clearSearch = () => {
  setSearchQuery('');
  setSearchResults(null);
  setShowSearchDropdown(false);
};
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
  <img src="/Logo.png" alt="InternLink" className={styles.logoImage} />
</Link>

          {/* Mobile Search Toggle */}
<button 
  className={styles.mobileSearchBtn}
  onClick={() => setShowMobileSearch(!showMobileSearch)}
>
  <Search size={20} />
</button>

        {/* Quick Search Bar */}
<div className={`${styles.searchContainer} ${showMobileSearch ? styles.searchVisible : ''}`} ref={searchRef}>  <Search size={18} className={styles.searchIcon} />
  <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
    <input
      type="text"
      placeholder="Search people, jobs, posts..."
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
      className={styles.searchInput}
    />
  </form>
  {searchQuery && (
    <button onClick={clearSearch} className={styles.searchClearBtn}>
      <X size={14} />
    </button>
  )}

  {/* Search Dropdown */}
  {showSearchDropdown && (
    <div className={styles.searchDropdown}>
      {searchResults ? (
        <>
          {searchResults.people?.length > 0 && (
            <div className={styles.searchSection}>
              <div className={styles.searchSectionHeader}>
                <User size={14} /> People
              </div>
              {searchResults.people.map(person => (
                <div key={person._id} className={styles.searchItem}
                  onClick={() => { navigate(`/profile/${person._id}`); setShowSearchDropdown(false); }}>
                  <div className={styles.searchAvatar}>
                    {person.avatar ? <img src={person.avatar} alt="" /> : <span>{person.name?.charAt(0)}</span>}
                  </div>
                  <div>
                    <div className={styles.searchName}>{person.name}</div>
                    <div className={styles.searchSub}>{person.headline || person.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.jobs?.length > 0 && (
            <div className={styles.searchSection}>
              <div className={styles.searchSectionHeader}>
                <Briefcase size={14} /> Jobs
              </div>
              {searchResults.jobs.map(job => (
                <div key={job._id} className={styles.searchItem}
                  onClick={() => { navigate('/jobs'); setShowSearchDropdown(false); }}>
                  <div>
                    <div className={styles.searchName}>{job.title}</div>
                    <div className={styles.searchSub}>{job.company} • {job.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.posts?.length > 0 && (
            <div className={styles.searchSection}>
              <div className={styles.searchSectionHeader}>
                <FileText size={14} /> Posts
              </div>
              {searchResults.posts.map(post => (
                <div key={post._id} className={styles.searchItem}
                  onClick={() => { navigate('/'); setShowSearchDropdown(false); }}>
                  <div>
                    <div className={styles.searchName}>{post.content}</div>
                    <div className={styles.searchSub}>{post.author} • {post.likes} likes</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.searchFooter}
            onClick={() => { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); setShowSearchDropdown(false); }}>
            See all results for "{searchQuery}"
          </div>
        </>
      ) : (
        <>
          {searchHistory.length > 0 && searchQuery.length < 2 && (
            <div className={styles.searchSection}>
              <div className={styles.searchSectionHeader}>
                <Clock size={14} /> Recent
              </div>
              {searchHistory.map((term, i) => (
                <div key={i} className={styles.searchItem}
                  onClick={() => { setSearchQuery(term); handleSearch(term); }}>
                  <span>{term}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )}
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