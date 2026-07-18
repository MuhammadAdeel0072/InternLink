import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
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
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', borderRight: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)', padding: '20px 0',
        flexShrink: 0
      }}>
        <h3 style={{ padding: '0 20px', fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚙️ Settings
        </h3>
        <div style={{ borderTop: '1px solid var(--border-color)', marginBottom: '8px' }} />
        {sidebarLinks.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 20px',
              display: 'flex', alignItems: 'center', gap: '10px',
              fontSize: '0.9rem', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === id ? 'var(--primary-light)' : 'transparent',
              color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === id ? 600 : 400,
              transition: 'all 0.15s'
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
        <Link to="/" style={{
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none'
        }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Account Settings</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Manage your account information.</p>
            
            <form onSubmit={handleAccountUpdate} style={{ maxWidth: '500px' }}>
              <div className="form-group"><label className="form-label">Profile Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => navigate('/profile/me')}>
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

            <div style={{ marginTop: '40px', padding: '20px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}>
              <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} /> Danger Zone
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '8px 0' }}>Delete your account permanently.</p>
              <button onClick={handleDeleteAccount} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Security</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Manage your password and sessions.</p>

            <form onSubmit={handlePasswordChange} style={{ maxWidth: '400px' }}>
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
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${Math.min(passwordForm.newPassword.length * 12.5, 100)}%`, backgroundColor: passwordForm.newPassword.length >= 8 ? '#22c55e' : '#ef4444', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: passwordForm.newPassword.length >= 8 ? '#22c55e' : '#ef4444' }}>
                    {passwordForm.newPassword.length >= 8 ? 'Strong' : 'Min 8 characters'}
                  </span>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>

            <div style={{ marginTop: '40px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Shield size={18} /> Active Sessions
              </h4>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <p>Current Device • Chrome • Windows</p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Login: Today • IP: 127.0.0.1</p>
              </div>
              <button onClick={handleLogoutAll} className="btn btn-secondary" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                Logout All Devices
              </button>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Privacy</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Control your profile visibility and permissions.</p>

            <div style={{ maxWidth: '400px' }}>
              <div className="form-group">
                <label className="form-label">Profile Visibility</label>
                <select className="form-input" value={preferences.privacy?.profileVisibility || 'public'}
                  onChange={(e) => handlePreferenceUpdate('privacy', { ...preferences.privacy, profileVisibility: e.target.value })}>
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
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem' }}>{label}</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input type="checkbox" checked={preferences.privacy?.[key] ?? true}
                      onChange={(e) => handlePreferenceUpdate('privacy', { ...preferences.privacy, [key]: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: preferences.privacy?.[key] ? 'var(--primary)' : 'var(--border-color)',
                      borderRadius: '24px', transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute', height: '18px', width: '18px', left: preferences.privacy?.[key] ? '23px' : '3px',
                        bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
                      }} />
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Appearance</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Choose your theme and font size.</p>

            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>Choose Theme</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {themes.map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => handlePreferenceUpdate('appearance', { ...preferences.appearance, theme: id })}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      padding: '20px', borderRadius: '12px', border: preferences.appearance?.theme === id ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                      backgroundColor: preferences.appearance?.theme === id ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                      cursor: 'pointer', minWidth: '80px'
                    }}>
                    <Icon size={24} color={preferences.appearance?.theme === id ? 'var(--primary)' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            
          </div>
        )}

        {/* ACCESSIBILITY TAB */}
        {activeTab === 'accessibility' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Accessibility</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Customize your experience.</p>

            <div style={{ maxWidth: '400px' }}>
              {[
                { key: 'reducedMotion', label: 'Reduce Motion' },
                { key: 'highContrast', label: 'High Contrast' },
                { key: 'largerText', label: 'Larger Text' },
                { key: 'keyboardNavigation', label: 'Keyboard Navigation' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem' }}>{label}</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input type="checkbox" checked={preferences.accessibility?.[key] ?? false}
                      onChange={(e) => handlePreferenceUpdate('accessibility', { ...preferences.accessibility, [key]: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: preferences.accessibility?.[key] ? 'var(--primary)' : 'var(--border-color)',
                      borderRadius: '24px', transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute', height: '18px', width: '18px', left: preferences.accessibility?.[key] ? '23px' : '3px',
                        bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
                      }} />
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Connected Accounts</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Manage your connected OAuth providers.</p>

            <div style={{ maxWidth: '400px' }}>
              {[
                { name: 'Google', connected: !!user?.googleId, color: '#4285F4' },
                { name: 'GitHub', connected: !!user?.githubId, color: '#24292e' },
              ].map(({ name, connected, color }) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: connected ? '#22c55e' : '#9ca3af' }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{connected ? 'Connected' : 'Not Connected'}</p>
                    </div>
                  </div>
                  <button className={connected ? 'btn btn-secondary' : 'btn btn-primary'} style={{ fontSize: '0.8rem' }}
                    onClick={connected ? async () => {
                      try { await api.put('/auth/disconnect-provider', { provider: name.toLowerCase() }); showMessage(`${name} disconnected`); window.location.reload(); } catch (err) { showMessage('Failed', 'error'); }
                    } : () => window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/${name.toLowerCase()}`}>
                    {connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Toast Notification - Bottom Right */}
      {message && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '14px 20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
          color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
          border: `1px solid ${message.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideIn 0.3s ease',
          maxWidth: '380px'
        }}>
          {message.type === 'error' ? '❌' : '✅'} {message.text}
        </div>
      )}
    </div>
  );
};

export default Settings;