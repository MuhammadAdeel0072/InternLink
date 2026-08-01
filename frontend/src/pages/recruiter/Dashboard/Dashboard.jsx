import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import styles from './Dashboard.module.css';
import {
  Briefcase,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Bell,
  Plus,
  Search,
  UserSearch,
  Building2,
  TrendingUp,
} from 'lucide-react';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    draftJobs: 0,
    applicants: 0,
    interviews: 0,
    messages: 0,
    notifications: 0,
    hasCompany: false,
    companyName: '',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/recruiter/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullPage />;
  }

  const statCards = [
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'var(--primary)', link: '/jobs' },
    { label: 'Draft Jobs', value: stats.draftJobs, icon: FileText, color: 'var(--warning)', link: '/jobs' },
    { label: 'Applicants', value: stats.applicants, icon: Users, color: 'var(--success)', link: '/jobs' },
    { label: 'Interviews', value: stats.interviews, icon: Calendar, color: '#8b5cf6', link: '/jobs' },
    { label: 'Messages', value: stats.messages, icon: MessageSquare, color: 'var(--info)', link: '/messages' },
    { label: 'Notifications', value: stats.notifications, icon: Bell, color: '#ec4899', link: '/notifications' },
  ];

  const quickActions = [
    { label: 'Create Job', icon: Plus, link: '/jobs', description: 'Post a new job opening' },
    { label: 'View Candidates', icon: UserSearch, link: '/network', description: 'Browse candidate profiles' },
    { label: 'Search Candidates', icon: Search, link: '/search', description: 'Find top talent' },
    { label: 'Company Profile', icon: Building2, link: '/recruiter/company-association', description: 'Manage company details' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user?.name?.split(' ')[0] || 'Recruiter'}</h1>
          <p className={styles.subtitle}>Here's what's happening with your hiring today.</p>
        </div>
        {stats.hasCompany && (
          <div className={styles.companyBadge}>
            <Building2 size={16} />
            {stats.companyName}
          </div>
        )}
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={styles.statCard}
              onClick={() => stat.link && navigate(stat.link)}
            >
              <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <TrendingUp size={20} />
          Quick Actions
        </h2>
        <div className={styles.actionsGrid}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className={styles.actionCard}
                onClick={() => navigate(action.link)}
              >
                <div className={styles.actionIcon}>
                  <Icon size={24} />
                </div>
                <div className={styles.actionContent}>
                  <span className={styles.actionLabel}>{action.label}</span>
                  <span className={styles.actionDescription}>{action.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
