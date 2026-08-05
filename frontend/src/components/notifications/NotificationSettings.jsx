import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Save } from 'lucide-react';
import PrimaryButton from '../../components/primaryButton/primaryButton';
import styles from './NotificationSettings.module.css';

const NotificationSettings = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState({
    email: true,
    inApp: true,
    push: false,
    categories: {
      system: true,
      network: true,
      message: true,
      job: true,
      application: true,
      interview: true,
      offer: true,
      hiring: true,
      company: true,
      post: true,
      security: true
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleToggle = (key) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCategoryToggle = (category) => {
    setLocalPrefs(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePreferences(localPrefs);
      onClose?.();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Notification Preferences</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3>Channels</h3>
            <div className={styles.toggles}>
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications in the app' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications (coming soon)' }
              ].map((item) => (
                <label key={item.key} className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>{item.label}</span>
                    <span className={styles.toggleDesc}>{item.desc}</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${localPrefs[item.key] ? styles.toggleOn : ''}`}
                    onClick={() => handleToggle(item.key)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3>Categories</h3>
            <div className={styles.categoryGrid}>
              {Object.entries(localPrefs.categories).map(([category, enabled]) => (
                <label key={category} className={styles.categoryRow}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  <span className={styles.categoryLabel}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <PrimaryButton onClick={handleSave} loading={saving}>
            <Save size={16} /> Save Preferences
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
