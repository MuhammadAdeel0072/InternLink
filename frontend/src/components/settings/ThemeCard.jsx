import React from 'react';
import styles from './ThemeCard.module.css';

const themeStyles = {
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    secondaryText: '#475569',
    border: '#E2E8F0',
    primary: '#4F46E5',
    sidebar: '#FFFFFF',
  },
  dark: {
    bg: '#0B0F19',
    card: '#151A24',
    text: '#FFFFFF',
    secondaryText: '#9CA3AF',
    border: 'rgba(255,255,255,0.08)',
    primary: '#6366F1',
    sidebar: '#151A24',
  },
  ocean: {
    bg: '#EAF6FF',
    card: '#FFFFFF',
    text: '#0F172A',
    secondaryText: '#334155',
    border: '#BFDBFE',
    primary: '#0EA5E9',
    sidebar: '#0F172A',
  },
};

const ThemeCard = React.memo(({ theme, isSelected, onClick, description, disabled }) => {
  const colors = themeStyles[theme] || themeStyles.dark;

  return (
    <button
      onClick={onClick}
      className={`${styles.themeCard} ${isSelected ? styles.themeCardSelected : ''} ${disabled ? styles.themeCardDisabled : ''}`}
      aria-pressed={isSelected}
      aria-label={`${theme} theme`}
      type="button"
      disabled={disabled}
    >
      <div className={styles.preview} style={{ backgroundColor: colors.bg }}>
        <div className={styles.previewNavbar} style={{ backgroundColor: colors.primary }} />
        <div className={styles.previewBody}>
          <div className={styles.previewSidebar} style={{ backgroundColor: colors.sidebar }} />
          <div className={styles.previewContent}>
            <div className={styles.previewCard} style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <div className={styles.previewLine} style={{ backgroundColor: colors.border }} />
              <div className={styles.previewLineShort} style={{ backgroundColor: colors.border }} />
              <div className={styles.previewButton} style={{ backgroundColor: colors.primary }} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.themeInfo}>
        <div className={styles.themeHeader}>
          <span className={styles.themeName}>{theme.charAt(0).toUpperCase() + theme.slice(1)} Theme</span>
          {isSelected && <span className={styles.selectedBadge} aria-hidden="true">✔</span>}
        </div>
        <p className={styles.themeDescription}>{description}</p>
      </div>
    </button>
  );
});

ThemeCard.displayName = 'ThemeCard';

export default ThemeCard;
