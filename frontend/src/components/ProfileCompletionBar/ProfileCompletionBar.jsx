import React from 'react';
import styles from './ProfileCompletionBar.module.css';

const completionChecks = [
  { key: 'headline', label: 'Professional Headline', icon: '📝' },
  { key: 'currentStatus', label: 'Current Status', icon: '🎯' },
  { key: 'avatar', label: 'Profile Photo', icon: '📸' },
  { key: 'summary', label: 'About / Summary', icon: '📄' },
  { key: 'resume', label: 'Resume Upload', icon: '📋' },
  { key: 'skills', label: 'Skills', icon: '🛠️' },
  { key: 'education', label: 'Education', icon: '🎓' },
  { key: 'experience', label: 'Experience', icon: '💼' },
  { key: 'projects', label: 'Projects', icon: '🚀' },
  { key: 'certifications', label: 'Certifications', icon: '🏅' },
];

const ProfileCompletionBar = ({ profile }) => {
  const percentage = profile?.completionPercentage || 0;

  const isComplete = (key) => {
    switch (key) {
      case 'headline': return !!(profile?.headline);
      case 'currentStatus': return !!(profile?.currentStatus);
      case 'avatar': return !!(profile?.avatar);
      case 'summary': return !!(profile?.summary);
      case 'resume': return !!(profile?.resume);
      case 'skills': return !!(profile?.skills?.length > 0);
      case 'education': return !!(profile?.education?.length > 0);
      case 'experience': return !!(profile?.experience?.length > 0);
      case 'projects': return !!(profile?.projects?.length > 0);
      case 'certifications': return !!(profile?.certifications?.length > 0);
      default: return false;
    }
  };

  const getColor = (percentage) => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getGradient = (percentage) => {
    if (percentage >= 80) {
      return 'linear-gradient(90deg, var(--primary), #22c55e)';
    }
    if (percentage >= 50) {
      return 'linear-gradient(90deg, var(--primary), #f59e0b)';
    }
    return 'linear-gradient(90deg, var(--primary), #ef4444)';
  };

  return (
    <div className={`card ${styles.completionCard}`}>
      <div className={styles.completionHeader}>
        <h3 className={styles.completionTitle}>Profile Completion</h3>
        <span 
          className={styles.completionPercentage}
          style={{ color: getColor(percentage) }}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{
            width: `${percentage}%`,
            background: getGradient(percentage)
          }}
        />
      </div>

      {/* Checklist */}
      <div className={styles.checklist}>
        {completionChecks.map(({ key, label, icon }) => {
          const complete = isComplete(key);
          return (
            <div 
              key={key} 
              className={`${styles.checklistItem} ${complete ? styles.checklistItemComplete : styles.checklistItemIncomplete}`}
            >
              <span className={styles.checklistIcon}>{complete ? '✅' : '⬜'}</span>
              <span className={styles.checklistEmoji}>{icon}</span>
              <span className={styles.checklistLabel}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileCompletionBar;