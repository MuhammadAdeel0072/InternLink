import React from 'react';

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

  return (
    <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Profile Completion</h3>
        <span style={{ 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          color: percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444' 
        }}>
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '8px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: `linear-gradient(90deg, var(--primary), ${percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'})`,
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
        {completionChecks.map(({ key, label, icon }) => {
          const complete = isComplete(key);
          return (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: complete ? '#22c55e' : 'var(--text-muted)',
              opacity: complete ? 1 : 0.6
            }}>
              <span>{complete ? '✅' : '⬜'}</span>
              <span style={{ fontSize: '0.85rem' }}>{icon}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileCompletionBar;