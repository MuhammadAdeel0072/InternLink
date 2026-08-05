import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home, User, Building2, Briefcase, Users,
  MessageSquare, Bell, Settings, UserSearch, Calendar, FileText,
  UserCheck, ClipboardCheck, MoreHorizontal
} from 'lucide-react';
import styles from './RecruiterSidebar.module.css';

const RecruiterSidebar = ({ unreadNotifications }) => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const moreSheetRef = useRef();

  const links = [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: Home },
    { to: '/recruiter/profile', label: 'Profile', icon: User },
    { to: '/recruiter/company-association', label: 'Company', icon: Building2 },
    { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/recruiter/applicants', label: 'Applicants', icon: UserSearch },
    { to: '/recruiter/interviews', label: 'Interviews', icon: Calendar },
    { to: '/recruiter/offers', label: 'Offers', icon: FileText },
    { to: '/recruiter/hiring', label: 'Hiring', icon: UserCheck },
    { to: '/recruiter/talent-pool', label: 'Talent Pool', icon: Users },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/notifications', label: 'Alerts', icon: Bell, badgeCount: unreadNotifications },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const primaryRecruiterLinks = [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: Home },
    { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/recruiter/applicants', label: 'Talent', icon: UserSearch },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/notifications', label: 'Alerts', icon: Bell, badgeCount: unreadNotifications },
  ];

  const moreRecruiterLinks = [
    { to: '/recruiter/profile', label: 'Profile', icon: User },
    { to: '/recruiter/company-association', label: 'Company', icon: Building2 },
    { to: '/recruiter/interviews', label: 'Interviews', icon: Calendar },
    { to: '/recruiter/offers', label: 'Offers', icon: FileText },
    { to: '/recruiter/hiring', label: 'Hiring', icon: UserCheck },
    { to: '/recruiter/talent-pool', label: 'Talent Pool', icon: Users },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreSheetRef.current && !moreSheetRef.current.contains(e.target)) {
        setShowMoreSheet(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <nav className={styles.sidebarNav}>
          {links.map((link) => {
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

        <div className={styles.sidebarFooter}>
          <span className={styles.footerText}>
            © 2026 InternLink Inc.
          </span>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {primaryRecruiterLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.bottomNavLink} ${isActive ? styles.bottomNavLinkActive : ''}`
              }
            >
              <div className={styles.bottomNavIconWrapper}>
                <Icon size={22} />
                {link.badgeCount > 0 && (
                  <span className={styles.bottomNavBadge}>
                    {link.badgeCount > 9 ? '9+' : link.badgeCount}
                  </span>
                )}
              </div>
              <span className={styles.bottomNavLabel}>{link.label}</span>
            </NavLink>
          );
        })}
        <button
          className={`${styles.bottomNavLink} ${styles.bottomNavMoreBtn}`}
          onClick={() => setShowMoreSheet(true)}
        >
          <div className={styles.bottomNavIconWrapper}>
            <MoreHorizontal size={22} />
          </div>
          <span className={styles.bottomNavLabel}>More</span>
        </button>
      </nav>

      {/* More Bottom Sheet Overlay */}
      {showMoreSheet && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowMoreSheet(false)}>
          <div className={styles.bottomSheet} ref={moreSheetRef} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHandle} />
            <div className={styles.bottomSheetContent}>
              <h3 className={styles.bottomSheetTitle}>More Options</h3>
              <nav className={styles.bottomSheetNav}>
                {moreRecruiterLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setShowMoreSheet(false)}
                      className={styles.bottomSheetLink}
                    >
                      <Icon size={20} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecruiterSidebar;
