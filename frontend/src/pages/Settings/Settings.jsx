import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import styles from './Settings.module.css';
import {
  User, Lock, Eye, Palette, Accessibility, Link2,
  ArrowLeft, Camera, Trash2, Shield, Globe, Moon, Sun, Waves
} from 'lucide-react';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { changeTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Account form
  const [accountForm, setAccountForm] = useState({
    name: '', username: '', email: '', phone: ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    appearance: { theme: 'system', fontSize: 'medium' },
    accessibility: { reducedMotion: false, highContrast: false, largerText: false, keyboardNavigation: false },
    privacy: { profileVisibility: 'public', allowConnectionRequests: true, allowMessages: true, showEmail: false, showPhone: false, searchEngineIndexing: true }
  });

  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      if (user.preferences) {
        setPreferences(prev => ({
          ...prev,
          ...user.preferences
        }));
      }
    }
  }, [user]);

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/account', accountForm);
      showMessage('Account updated successfully');
      updateUser(res.data.data);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showMessage('Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showMessage('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMessage(err.response?.data?.message || 'Password change failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceUpdate = async (type, data) => {
    try {
      const res = await api.put('/auth/preferences', { type, data });
      
      if (type === 'appearance' && data.theme) {
        changeTheme(data.theme);
      }
      
      showMessage(`${type} settings saved`);
      setPreferences(prev => ({ 
        ...prev, 
        [type]: { ...prev[type], ...data }
      }));
    } catch (err) {
      showMessage(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/login');
    } catch (err) {
      showMessage('Delete failed', 'error');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
      logout();
      navigate('/login');
    } catch (err) {
      showMessage('Failed', 'error');
    }
  };

  const sidebarLinks = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'connected', label: 'Connected Accounts', icon: Link2 },
  ];

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'ocean', icon: Waves, label: 'Ocean' },
    { id: 'system', icon: Globe, label: 'System' },
  ];

  return (
    <div className={styles.settingsContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>
          ⚙️ Settings
        </h3>
        <div className={styles.sidebarDivider} />
        {sidebarLinks.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`${styles.sidebarLink} ${activeTab === id ? styles.sidebarLinkActive : ''}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <div className={styles.sidebarDivider} />
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </aside>

      {/* Content */}
      <main className={styles.mainContent}>

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div>
            <h2 className={styles.tabTitle}>Account Settings</h2>
            <p className={styles.tabSubtitle}>Manage your account information.</p>
            
            <form onSubmit={handleAccountUpdate} className={styles.formContainer}>
              <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <div className={styles.profilePhotoSection}>
                  <div className={styles.profilePhotoPlaceholder}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <button 
                    type="button" 
                    className={`btn btn-secondary ${styles.profilePhotoBtn}`} 
                    onClick={() => navigate('/profile/me')}
                  >
                    <Camera size={14} /> Change on Profile
                  </button>
                </div>
              </div>

              {[
                { label: 'Full Name', name: 'name', placeholder: 'John Smith' },
                { label: 'Username', name: 'username', placeholder: 'johnsmith' },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'john@example.com' },
                { label: 'Phone Number', name: 'phone', placeholder: '+1 (555) 123-4567' },
              ].map(field => (
                <div className="form-group" key={field.name}>
                  <label className="form-label">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    className="form-input"
                    placeholder={field.placeholder}
                    value={accountForm[field.name]}
                    onChange={(e) => setAccountForm({ ...accountForm, [field.name]: e.target.value })}
                  />
                </div>
              ))}

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            <div className={styles.dangerZone}>
              <h4 className={styles.dangerZoneTitle}>
                <Trash2 size={16} /> Danger Zone
              </h4>
              <p className={styles.dangerZoneText}>Delete your account permanently.</p>
              <button onClick={handleDeleteAccount} className={styles.dangerZoneBtn}>
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div>
            <h2 className={styles.tabTitle}>Security</h2>
            <p className={styles.tabSubtitle}>Manage your password and sessions.</p>

            <form onSubmit={handlePasswordChange} className={styles.formContainer}>
              {[
                { label: 'Current Password', name: 'currentPassword' },
                { label: 'New Password', name: 'newPassword' },
                { label: 'Confirm Password', name: 'confirmPassword' },
              ].map(field => (
                <div className="form-group" key={field.name}>
                  <label className="form-label">{field.label}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={passwordForm[field.name]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [field.name]: e.target.value })}
                  />
                </div>
              ))}
              {passwordForm.newPassword && (
                <div className={styles.passwordStrength}>
                  <div className={styles.passwordStrengthBar}>
                    <div 
                      className={styles.passwordStrengthFill}
                      style={{ 
                        width: `${Math.min(passwordForm.newPassword.length * 12.5, 100)}%`,
                        backgroundColor: passwordForm.newPassword.length >= 8 ? '#22c55e' : '#ef4444'
                      }} 
                    />
                  </div>
                  <span className={styles.passwordStrengthText}>
                    {passwordForm.newPassword.length >= 8 ? 'Strong' : 'Min 8 characters'}
                  </span>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>

            <div className={styles.sessionsSection}>
              <h4 className={styles.sessionsTitle}>
                <Shield size={18} /> Active Sessions
              </h4>
              <div className={styles.sessionCard}>
                <p className={styles.sessionDevice}>Current Device • Chrome • Windows</p>
                <p className={styles.sessionMeta}>Login: Today • IP: 127.0.0.1</p>
              </div>
              <button onClick={handleLogoutAll} className={`btn btn-secondary ${styles.logoutAllBtn}`}>
                Logout All Devices
              </button>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div>
            <h2 className={styles.tabTitle}>Privacy</h2>
            <p className={styles.tabSubtitle}>Control your profile visibility and permissions.</p>

            <div className={styles.privacyContainer}>
              <div className="form-group">
                <label className="form-label">Profile Visibility</label>
                <select 
                  className="form-input" 
                  value={preferences.privacy?.profileVisibility || 'public'}
                  onChange={(e) => handlePreferenceUpdate('privacy', { ...preferences.privacy, profileVisibility: e.target.value })}
                >
                  <option value="public">Public</option>
                  <option value="connections">Connections Only</option>
                  <option value="recruiters">Recruiters Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {[
                { key: 'allowConnectionRequests', label: 'Allow connection requests' },
                { key: 'allowMessages', label: 'Allow messages' },
                { key: 'showEmail', label: 'Show email on profile' },
                { key: 'showPhone', label: 'Show phone on profile' },
                { key: 'searchEngineIndexing', label: 'Search engine indexing' },
              ].map(({ key, label }) => (
                <div key={key} className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>{label}</span>
                  <label className={styles.toggleSwitch}>
                    <input 
                      type="checkbox" 
                      checked={preferences.privacy?.[key] ?? true}
                      onChange={(e) => handlePreferenceUpdate('privacy', { ...preferences.privacy, [key]: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}>
                      <span className={styles.toggleKnob} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div>
            <h2 className={styles.tabTitle}>Appearance</h2>
            <p className={styles.tabSubtitle}>Choose your theme and font size.</p>

            <div className={styles.themeSection}>
              <label className="form-label">Choose Theme</label>
              <div className={styles.themeGrid}>
                {themes.map(({ id, icon: Icon, label }) => (
                  <button 
                    key={id} 
                    onClick={() => handlePreferenceUpdate('appearance', { ...preferences.appearance, theme: id })}
                    className={`${styles.themeOption} ${preferences.appearance?.theme === id ? styles.themeOptionActive : ''}`}
                  >
                    <Icon size={24} className={preferences.appearance?.theme === id ? styles.themeIconActive : styles.themeIcon} />
                    <span className={styles.themeLabel}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCESSIBILITY TAB */}
        {activeTab === 'accessibility' && (
          <div>
            <h2 className={styles.tabTitle}>Accessibility</h2>
            <p className={styles.tabSubtitle}>Customize your experience.</p>

            <div className={styles.accessibilityContainer}>
              {[
                { key: 'reducedMotion', label: 'Reduce Motion' },
                { key: 'highContrast', label: 'High Contrast' },
                { key: 'largerText', label: 'Larger Text' },
                { key: 'keyboardNavigation', label: 'Keyboard Navigation' },
              ].map(({ key, label }) => (
                <div key={key} className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>{label}</span>
                  <label className={styles.toggleSwitch}>
                    <input 
                      type="checkbox" 
                      checked={preferences.accessibility?.[key] ?? false}
                      onChange={(e) => handlePreferenceUpdate('accessibility', { ...preferences.accessibility, [key]: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}>
                      <span className={styles.toggleKnob} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONNECTED ACCOUNTS TAB */}
        {activeTab === 'connected' && (
          <div>
            <h2 className={styles.tabTitle}>Connected Accounts</h2>
            <p className={styles.tabSubtitle}>Manage your connected OAuth providers.</p>

            <div className={styles.connectedContainer}>
              {[
                { name: 'Google', connected: !!user?.googleId, color: '#4285F4' },
                { name: 'GitHub', connected: !!user?.githubId, color: '#24292e' },
              ].map(({ name, connected, color }) => (
                <div key={name} className={styles.connectedItem}>
                  <div className={styles.connectedInfo}>
                    <div className={`${styles.connectedDot} ${connected ? styles.connectedDotActive : styles.connectedDotInactive}`} />
                    <div>
                      <p className={styles.connectedName}>{name}</p>
                      <p className={styles.connectedStatus}>{connected ? 'Connected' : 'Not Connected'}</p>
                    </div>
                  </div>
                  <button 
                    className={connected ? 'btn btn-secondary' : 'btn btn-primary'}
                    onClick={connected ? async () => {
                      try { 
                        await api.put('/auth/disconnect-provider', { provider: name.toLowerCase() }); 
                        showMessage(`${name} disconnected`); 
                        window.location.reload(); 
                      } catch (err) { 
                        showMessage('Failed', 'error'); 
                      }
                    } : () => window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/${name.toLowerCase()}`}
                  >
                    {connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Toast Notification */}
      {message && (
        <div className={`${styles.toast} ${message.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {message.type === 'error' ? '❌' : '✅'} {message.text}
        </div>
      )}
    </div>
  );
};

export default Settings;