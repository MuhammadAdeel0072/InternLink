import React from 'react';
import styles from './EmptyTalentState.module.css';

const EmptyTalentState = ({ type = 'main' }) => {
  const config = {
    main: {
      icon: '🔍',
      title: 'No candidates found',
      subtitle: 'Your talent pool is empty. Start building your candidate database by saving talented professionals.',
      actionLabel: 'Browse Search Results',
      actionLink: '/search'
    },
    search: {
      icon: '🎯',
      title: 'No matching candidates',
      subtitle: 'Try adjusting your search terms or filters to find candidates.',
      actionLabel: null,
      actionLink: null
    },
    archived: {
      icon: '📦',
      title: 'No archived candidates',
      subtitle: 'Candidates you archive will appear here.',
      actionLabel: null,
      actionLink: null
    },
    favorites: {
      icon: '⭐',
      title: 'No favorite candidates',
      subtitle: 'Mark candidates as favorites to find them quickly here.',
      actionLabel: null,
      actionLink: null
    }
  };

  const { icon, title, subtitle, actionLabel, actionLink } = config[type] || config.main;

  return (
    <div className={styles.emptyState}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.subtitle}>{subtitle}</p>
      {actionLabel && actionLink && (
        <a href={actionLink} className={styles.actionBtn}>
          {actionLabel}
        </a>
      )}
    </div>
  );
};

export default EmptyTalentState;
