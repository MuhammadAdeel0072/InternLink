import React from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import NotificationCenter from '../../../components/notifications/NotificationCenter';
import NotificationSettings from '../../../components/notifications/NotificationSettings';
import styles from './Notifications.module.css';

const Notifications = () => {
  const [showSettings, setShowSettings] = React.useState(false);
  const { refreshAll } = useNotifications();

  React.useEffect(() => {
    refreshAll();
  }, []);

  return (
    <div className={styles.page}>
      <NotificationCenter onRefresh={refreshAll} />
      {showSettings && (
        <NotificationSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Notifications;
