import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import api, { API_URL } from '../../../services/api';
import styles from './Settings.module.css';
import ThemeSelector from '../../../components/settings/ThemeSelector';
import {
  User, Lock, Eye, Palette, Accessibility, Link2,
  ArrowLeft, Camera, Trash2, Monitor,
  Globe, Save, History, LogOut,
  ChevronRight, Loader2, AlertTriangle, XCircle, CheckCircle2
} from 'lucide-react';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { changeTheme, currentTheme, theme: storedTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [sectionLoading, setSectionLoading] = useState({});
  const [message, setMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Account form
  const [accountForm, setAccountForm] = useState({
    name: '', username: '', email: '', phone: ''
  });
  const [accountErrors, setAccountErrors] = useState({});
  const [usernameStatus, setUsernameStatus] = useState('idle');

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Preferences
  const [preferences, setPreferences] = useState({
    appearance: { theme: 'system', fontSize: 'medium' },
    accessibility: { reducedMotion: false, highContrast: false, largerText: false, keyboardNavigation: false },
    privacy: { profileVisibility: 'public', allowConnectionRequests: true, allowMessages: true, showEmail: false, showPhone: false, searchEngineIndexing: true }
  });

  // Sessions & history
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      if (user.preferences) {
        setPreferences(prev => ({ ...prev, ...user.preferences }));
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab]);

  const showMessage = useCallback((msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const setSectionLoadingState = (section, isLoading) => {
    setSectionLoading(prev => ({ ...prev, [section]: isLoading }));
  };

  const validateAccount = () => {
    const errors = {};
    if (!accountForm.name.trim()) errors.name = 'Name is required';
    if (accountForm.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (accountForm.username && !USERNAME_REGEX.test(accountForm.username)) {
      errors.username = 'Username must be 3-30 characters (letters, numbers, _, -)';
    }
    if (!accountForm.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.email)) errors.email = 'Please enter a valid email';
    if (accountForm.phone && !PHONE_REGEX.test(accountForm.phone)) errors.phone = 'Please enter a valid phone number';
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username === user?.username) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await api.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
      const availability = res.data.data?.available ?? res.data.available;
      setUsernameStatus(availability ? 'available' : 'taken');
    } catch {
      setUsernameStatus('error');
    }
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    if (!validateAccount()) return;

    setSectionLoadingState('account', true);
    try {
      const res = await api.put('/auth/account', accountForm);
      updateUser(res.data.data);
      showMessage('Account updated successfully');
      setUsernameStatus('idle');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSectionLoadingState('account', false);
    }
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!PASSWORD_REGEX.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must be 8+ chars with uppercase, lowercase, number, and special character';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (passwordForm.newPassword) {
      let strength = 0;
      if (passwordForm.newPassword.length >= 8) strength++;
      if (/[A-Z]/.test(passwordForm.newPassword)) strength++;
      if (/[a-z]/.test(passwordForm.newPassword)) strength++;
      if (/[0-9]/.test(passwordForm.newPassword)) strength++;
      if (/[@$!%*?&]/.test(passwordForm.newPassword)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [passwordForm.newPassword]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setSectionLoadingState('password', true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showMessage('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      showMessage(err.response?.data?.message || 'Password change failed', 'error');
    } finally {
      setSectionLoadingState('password', false);
    }
  };

  const handlePreferenceUpdate = async (type, data) => {
    setSectionLoadingState(type, true);
    try {
      const res = await api.put('/auth/preferences', { type, data });
      if (type === 'appearance' && data.theme) {
        changeTheme(data.theme);
      }
      setPreferences(prev => ({ ...prev, [type]: { ...prev[type], ...data } }));
      updateUser({ preferences: res.data.data });
      showMessage(`${type} settings saved`);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSectionLoadingState(type, false);
    }
  };

  const handleDeleteAccount = async () => {
    setSectionLoadingState('account', true);
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
      showMessage('Delete failed', 'error');
      setShowDeleteConfirm(false);
      setSectionLoadingState('account', false);
    }
  };

  const handleLogoutAll = async () => {
    setSectionLoadingState('security', true);
    try {
      await api.post('/auth/logout-all');
      showMessage('Logged out from all devices');
      logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
      showMessage('Failed to logout all devices', 'error');
      setSectionLoadingState('security', false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.data?.activeSessions || []);
      setLoginHistory(res.data.data?.loginHistory || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleDisconnectProvider = async (provider) => {
    try {
      await api.put('/auth/disconnect-provider', { provider });
      showMessage(`${provider} disconnected`);
      updateUser({ [`${provider}Id`]: undefined });
    } catch (err) {
      console.error(err);
      showMessage('Failed to disconnect', 'error');
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

  const passwordStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const passwordStrengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  return (
    <div className={styles.settingsContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Settings</h3>
        </div>
        <nav className={styles.sidebarNav}>
          {sidebarLinks.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`${styles.sidebarLink} ${activeTab === id ? styles.sidebarLinkActive : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {activeTab === id && <ChevronRight size={14} className={styles.sidebarChevron} />}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.contentHeader}>
          <div>
            <h1 className={styles.pageTitle}>{sidebarLinks.find(l => l.id === activeTab)?.label}</h1>
            <p className={styles.pageSubtitle}>
              {activeTab === 'account' && 'Manage your account information and profile details.'}
              {activeTab === 'security' && 'Manage your password, sessions, and login security.'}
              {activeTab === 'privacy' && 'Control your profile visibility and permissions.'}
              {activeTab === 'appearance' && 'Customize how InternLink looks for you.'}
              {activeTab === 'accessibility' && 'Adjust accessibility preferences.'}
              {activeTab === 'connected' && 'Manage your connected OAuth providers.'}
            </p>
          </div>
        </div>

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className={styles.sectionStack}>
            <form onSubmit={handleAccountUpdate} className={styles.card}>
              <h2 className={styles.cardTitle}>Profile Information</h2>
              <p className={styles.cardSubtitle}>Update your personal details and contact information.</p>

              <div className={styles.formGrid}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarLarge}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <button type="button" className={`btn btn-secondary ${styles.avatarBtn}`} onClick={() => navigate('/profile/me')}>
                    <Camera size={14} /> Change on Profile
                  </button>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Full Name</label>
                  <input
                    type="text"
                    className={`${styles.fieldInput} ${accountErrors.name ? styles.fieldInputError : ''}`}
                    placeholder="John Smith"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  />
                  {accountErrors.name && <span className={styles.fieldError}>{accountErrors.name}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Username</label>
                  <input
                    type="text"
                    className={`${styles.fieldInput} ${accountErrors.username ? styles.fieldInputError : ''}`}
                    placeholder="johndoe"
                    value={accountForm.username}
                    onChange={(e) => {
                      setAccountForm({ ...accountForm, username: e.target.value });
                      checkUsernameAvailability(e.target.value);
                    }}
                  />
                  {accountErrors.username && <span className={styles.fieldError}>{accountErrors.username}</span>}
                  {accountForm.username && usernameStatus === 'checking' && <span className={styles.fieldHint}>Checking availability...</span>}
                  {usernameStatus === 'available' && <span className={styles.fieldSuccess}>Username is available</span>}
                  {usernameStatus === 'taken' && <span className={styles.fieldError}>Username is already taken</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <input
                    type="email"
                    className={`${styles.fieldInput} ${accountErrors.email ? styles.fieldInputError : ''}`}
                    placeholder="john@example.com"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  />
                  {accountErrors.email && <span className={styles.fieldError}>{accountErrors.email}</span>}
                  {!user?.isVerified && <span className={styles.fieldWarning}>Email not verified</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone Number</label>
                  <input
                    type="tel"
                    className={`${styles.fieldInput} ${accountErrors.phone ? styles.fieldInputError : ''}`}
                    placeholder="+1 (555) 123-4567"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  />
                  {accountErrors.phone && <span className={styles.fieldError}>{accountErrors.phone}</span>}
                </div>
              </div>

              <div className={styles.cardActions}>
                <button type="submit" className={`btn btn-primary`} disabled={sectionLoading.account}>
                  {sectionLoading.account ? <><Loader2 size={16} className={styles.spinner} /> Saving...</> : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </form>

            <div className={`${styles.card} ${styles.dangerZone}`}>
              <h3 className={styles.dangerZoneTitle}><Trash2 size={18} /> Danger Zone</h3>
              <p className={styles.dangerZoneText}>Once you delete your account, there is no going back. Please be certain.</p>
              <button onClick={() => setShowDeleteConfirm(true)} className={styles.dangerZoneBtn}>
                Delete Account
              </button>
            </div>

            {showDeleteConfirm && (
              <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalIcon}><AlertTriangle size={32} /></div>
                  <h3 className={styles.modalTitle}>Delete your account?</h3>
                  <p className={styles.modalText}>This action cannot be undone. All your data, posts, and connections will be permanently removed.</p>
                  <div className={styles.modalActions}>
                    <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleDeleteAccount} className={styles.dangerZoneBtn} disabled={sectionLoading.account}>
                      {sectionLoading.account ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
             </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Blocked Users</h2>
              <p className={styles.cardSubtitle}>Manage users you've blocked. Blocked users cannot message you or send connection requests.</p>
              <div className={styles.fieldGroup}>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Search for users to block"
                />
              </div>
            </div>
          </div>
        )}
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className={styles.sectionStack}>
            <form onSubmit={handlePasswordChange} className={styles.card}>
              <h2 className={styles.cardTitle}>Change Password</h2>
              <p className={styles.cardSubtitle}>Update your password to keep your account secure.</p>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Current Password</label>
                  <input
                    type="password"
                    className={`${styles.fieldInput} ${passwordErrors.currentPassword ? styles.fieldInputError : ''}`}
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                  {passwordErrors.currentPassword && <span className={styles.fieldError}>{passwordErrors.currentPassword}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>New Password</label>
                  <input
                    type="password"
                    className={`${styles.fieldInput} ${passwordErrors.newPassword ? styles.fieldInputError : ''}`}
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                  {passwordErrors.newPassword && <span className={styles.fieldError}>{passwordErrors.newPassword}</span>}
                  {passwordForm.newPassword && (
                    <div className={styles.strengthBar}>
                      <div className={styles.strengthFill} style={{ width: `${(passwordStrength / 5) * 100}%`, backgroundColor: passwordStrengthColor[passwordStrength] }} />
                    </div>
                  )}
                  {passwordForm.newPassword && <span className={styles.strengthLabel} style={{ color: passwordStrengthColor[passwordStrength] }}>{passwordStrengthLabel[passwordStrength]}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Confirm New Password</label>
                  <input
                    type="password"
                    className={`${styles.fieldInput} ${passwordErrors.confirmPassword ? styles.fieldInputError : ''}`}
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                  {passwordErrors.confirmPassword && <span className={styles.fieldError}>{passwordErrors.confirmPassword}</span>}
                </div>
              </div>

              <div className={styles.cardActions}>
                <button type="submit" className="btn btn-primary" disabled={sectionLoading.password}>
                  {sectionLoading.password ? <><Loader2 size={16} className={styles.spinner} /> Changing...</> : 'Change Password'}
                </button>
              </div>
            </form>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Active Sessions</h2>
              <p className={styles.cardSubtitle}>Manage your active sessions across devices.</p>
              {sessions.length === 0 ? (
                <p className={styles.emptyText}>No active sessions found.</p>
              ) : (
                <div className={styles.sessionList}>
                  {sessions.map((session, idx) => (
                    <div key={idx} className={styles.sessionItem}>
                      <div className={styles.sessionIcon}><Monitor size={20} /></div>
                      <div className={styles.sessionInfo}>
                        <p className={styles.sessionDevice}>{session.device || 'Unknown Device'} • {session.browser || 'Unknown Browser'}</p>
                        <p className={styles.sessionMeta}>IP: {session.ip || 'N/A'} • {session.location || 'Unknown Location'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.cardActions}>
                <button onClick={handleLogoutAll} className="btn btn-secondary" disabled={sectionLoading.security}>
                  {sectionLoading.security ? <><Loader2 size={16} className={styles.spinner} /> Logging out...</> : <><LogOut size={16} /> Logout All Devices</>}
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Login History</h2>
              <p className={styles.cardSubtitle}>Recent login activity on your account.</p>
              {loginHistory.length === 0 ? (
                <p className={styles.emptyText}>No login history available.</p>
              ) : (
                <div className={styles.historyList}>
                  {loginHistory.slice(0, 10).map((entry, idx) => (
                    <div key={idx} className={styles.historyItem}>
                      <div className={styles.historyIcon}><History size={18} /></div>
                      <div className={styles.historyInfo}>
                        <p className={styles.historyBrowser}>{entry.browser || 'Unknown Browser'} • {entry.location || 'Unknown'}</p>
                        <p className={styles.historyTime}>{new Date(entry.loginTime).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Two-Factor Authentication</h2>
              <p className={styles.cardSubtitle}>Add an extra layer of security to your account.</p>
              <div className={styles.comingSoon}>
                <Lock size={32} />
                <div>
                  <h4 className={styles.comingSoonTitle}>Coming Soon</h4>
                  <p className={styles.comingSoonText}>Two-factor authentication will be available in a future update.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className={styles.sectionStack}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Profile Visibility</h2>
              <p className={styles.cardSubtitle}>Control who can view your profile.</p>
              <div className={styles.fieldGroup}>
                <select
                  className={styles.fieldSelect}
                  value={preferences.privacy?.profileVisibility || 'public'}
                  onChange={(e) => handlePreferenceUpdate('privacy', { ...preferences.privacy, profileVisibility: e.target.value })}
                >
                  <option value="public">Public - Everyone can view</option>
                  <option value="connections">Connections Only</option>
                  <option value="recruiters">Recruiters Only</option>
                  <option value="private">Private - Only you</option>
                </select>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Permissions</h2>
              <p className={styles.cardSubtitle}>Manage who can interact with you.</p>
              <div className={styles.toggleList}>
                {[
                  { key: 'allowConnectionRequests', label: 'Allow connection requests', description: 'Let others send you connection requests' },
                  { key: 'allowMessages', label: 'Allow messages', description: 'Let others send you direct messages' },
                  { key: 'showEmail', label: 'Show email on profile', description: 'Display your email address to visitors' },
                  { key: 'showPhone', label: 'Show phone on profile', description: 'Display your phone number to visitors' },
                  { key: 'searchEngineIndexing', label: 'Search engine indexing', description: 'Allow search engines to index your profile' },
                ].map(({ key, label, description }) => (
                  <div key={key} className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{label}</span>
                      <span className={styles.toggleDescription}>{description}</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={preferences.privacy?.[key] ?? true}
                        onChange={(e) => handlePreferenceUpdate('privacy', { ...preferences.privacy, [key]: e.target.checked })}
                        disabled={sectionLoading.privacy}
                      />
                      <span className={styles.toggleSlider}><span className={styles.toggleKnob} /></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className={styles.sectionStack}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Theme</h2>
              <p className={styles.cardSubtitle}>Choose how InternLink looks for you. Select a theme or match your system settings.</p>
              <ThemeSelector
                value={storedTheme || currentTheme}
                onChange={(themeId) => handlePreferenceUpdate('appearance', { ...preferences.appearance, theme: themeId })}
                disabled={sectionLoading.appearance}
              />
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Font Size</h2>
              <p className={styles.cardSubtitle}>Adjust the text size across the application.</p>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Font Size</label>
                <select
                  className={styles.fieldSelect}
                  value={preferences.appearance?.fontSize || 'medium'}
                  onChange={(e) => handlePreferenceUpdate('appearance', { ...preferences.appearance, fontSize: e.target.value })}
                  disabled={sectionLoading.appearance}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ACCESSIBILITY TAB */}
        {activeTab === 'accessibility' && (
          <div className={styles.sectionStack}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Accessibility</h2>
              <p className={styles.cardSubtitle}>Adjust preferences to improve your experience.</p>
              <div className={styles.toggleList}>
                {[
                  { key: 'reducedMotion', label: 'Reduce Motion', description: 'Minimize animations throughout the interface' },
                  { key: 'highContrast', label: 'High Contrast', description: 'Increase contrast for better readability' },
                  { key: 'largerText', label: 'Larger Text', description: 'Increase text size across the application' },
                  { key: 'keyboardNavigation', label: 'Keyboard Navigation', description: 'Enhanced keyboard navigation support' },
                ].map(({ key, label, description }) => (
                  <div key={key} className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{label}</span>
                      <span className={styles.toggleDescription}>{description}</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={preferences.accessibility?.[key] ?? false}
                        onChange={(e) => handlePreferenceUpdate('accessibility', { ...preferences.accessibility, [key]: e.target.checked })}
                        disabled={sectionLoading.accessibility}
                      />
                      <span className={styles.toggleSlider}><span className={styles.toggleKnob} /></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONNECTED ACCOUNTS TAB */}
        {activeTab === 'connected' && (
          <div className={styles.sectionStack}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Connected Accounts</h2>
              <p className={styles.cardSubtitle}>Manage your connected OAuth providers and linked accounts.</p>
              <div className={styles.connectedList}>
                {[
                  { name: 'Google', connected: !!user?.googleId, color: '#4285F4', icon: Globe },
                  { name: 'GitHub', connected: !!user?.githubId, color: '#24292e', icon: Link2 },
                ].map(({ name, connected, color, icon: Icon }) => (
                  <div key={name} className={styles.connectedItem}>
                    <div className={styles.connectedIcon} style={{ backgroundColor: `${color}20`, color }}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.connectedInfo}>
                      <p className={styles.connectedName}>{name}</p>
                      <p className={styles.connectedStatus}>{connected ? 'Connected' : 'Not Connected'}</p>
                    </div>
                    <button
                      className={connected ? 'btn btn-secondary' : 'btn btn-primary'}
                      onClick={() => connected ? handleDisconnectProvider(name.toLowerCase()) : window.location.href = `${API_URL}/api/auth/${name.toLowerCase()}`}
                    >
                      {connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {message && (
        <div className={`${styles.toast} ${message.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {message.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}
    </div>
  );
};

export default Settings;
