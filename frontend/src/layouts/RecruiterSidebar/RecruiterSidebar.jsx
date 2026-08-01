import { NavLink } from 'react-router-dom';
import {
  Home, User, Building2, Briefcase, Users,
  MessageSquare, Bell, Settings, UserSearch
} from 'lucide-react';
import styles from './RecruiterSidebar.module.css';

const RecruiterSidebar = ({ unreadNotifications }) => {
  const links = [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: Home },
    { to: '/recruiter/profile', label: 'Profile', icon: User },
    { to: '/recruiter/company-association', label: 'Company', icon: Building2 },
    { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/recruiter/applicants', label: 'Applicants', icon: UserSearch },
    { to: '/network', label: 'Talent Pool', icon: Users },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/notifications', label: 'Notifications', icon: Bell, badgeCount: unreadNotifications },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
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
  );
};

export default RecruiterSidebar;
