import React from 'react';
import { Users, UserPlus, MessageSquare, Briefcase, Bookmark, Star } from 'lucide-react';
import styles from './TalentStats.module.css';

const ICON_MAP = {
  Users,
  UserPlus,
  MessageSquare,
  Briefcase,
  Bookmark,
  Star,
};

const TalentStats = ({ stats }) => {
  if (!stats) return null;

  const cards = [
    { label: 'Total Candidates', value: stats.totalCandidates || 0, icon: 'Users', color: 'var(--primary)' },
    { label: 'New This Month', value: stats.newThisMonth || 0, icon: 'UserPlus', color: 'var(--success)' },
    { label: 'Contacted', value: stats.contacted || 0, icon: 'MessageSquare', color: 'var(--info)' },
    { label: 'Available for Work', value: stats.availableForWork || 0, icon: 'Briefcase', color: '#8b5cf6' },
    { label: 'Saved Candidates', value: stats.savedCandidates || 0, icon: 'Bookmark', color: 'var(--warning)' },
    { label: 'Favorite Candidates', value: stats.favoriteCandidates || 0, icon: 'Star', color: '#ec4899' },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map((card) => {
        const IconComponent = ICON_MAP[card.icon];
        return (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ background: `${card.color}15`, color: card.color }}>
              {IconComponent && <IconComponent size={22} />}
            </div>
            <div className={styles.content}>
              <span className={styles.value}>{card.value}</span>
              <span className={styles.label}>{card.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TalentStats;
