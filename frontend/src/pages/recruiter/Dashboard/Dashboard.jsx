import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import styles from './Dashboard.module.css';
import { Camera, Save, Globe, Linkedin } from 'lucide-react';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const avatarInputRef = useRef();
  const coverInputRef = useRef();

  const [formData, setFormData] = useState({
    headline: '',
    summary: '',
    phone: '',
    website: '',
    linkedin: '',
    country: '',
    city: '',
    jobTitle: '',
    department: '',
    yearsOfExperience: '',
    visibility: 'public'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      setProfile(res.data);
      setFormData({
        headline: res.data.headline || '',
        summary: res.data.summary || '',
        phone: res.data.phone || '',
        website: res.data.website || '',
        linkedin: res.data.linkedin || '',
        country: res.data.location?.country || '',
        city: res.data.location?.city || '',
        jobTitle: res.data.jobTitle || '',
        department: res.data.department || '',
        yearsOfExperience: res.data.yearsOfExperience || '',
        visibility: res.data.visibility || 'public'
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : undefined,
      };
      const res = await api.put('/profile', payload);
      setProfile(res.data);
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append(type, file);
    try {
      const res = await api.post(`/profile/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
    } catch (err) {
      alert('Upload failed');
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.container}>
      
      <h1 className={styles.pageTitle}>Recruiter Profile</h1>
      <p className={styles.pageSubtitle}>Complete your profile to attract top student talent</p>

      {message && (
        <div className={`${styles.messageBox} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
          {message.text}
        </div>
      )}

      {/* Cover & Avatar */}
      <div className={`card ${styles.coverCard}`}>
        <div
          className={styles.coverImage}
          style={{ backgroundImage: profile?.cover ? `url(${profile.cover})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <button onClick={() => coverInputRef.current.click()} className={styles.coverBtn}>
            <Camera size={14} /> Change Cover
          </button>
          <input type="file" ref={coverInputRef} onChange={(e) => handleFileUpload(e, 'cover')} accept="image/*" hidden />
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarFallback}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => avatarInputRef.current.click()} className={styles.avatarBtn}>
              <Camera size={14} />
            </button>
            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar')} accept="image/*" hidden />
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className={`card ${styles.formCard}`}>
        <h3 className={styles.sectionTitle}>Professional Information</h3>
        
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Professional Headline *</label>
            <input type="text" name="headline" className="form-input" placeholder="Senior Technical Recruiter at Google"
              value={formData.headline} onChange={handleChange} required />
          </div>

          <div className={styles.twoColumns}>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input type="text" name="jobTitle" className="form-input" placeholder="Technical Recruiter"
                value={formData.jobTitle} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input type="text" name="department" className="form-input" placeholder="Human Resources"
                value={formData.department} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input type="number" name="yearsOfExperience" className="form-input" placeholder="5"
              value={formData.yearsOfExperience} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">About / Professional Summary</label>
            <textarea name="summary" className="form-input" rows={4} placeholder="Tell students about your company and hiring focus..."
              value={formData.summary} onChange={handleChange} maxLength={1000} />
            <span className={styles.charCounter}>{formData.summary.length}/1000</span>
          </div>

          <h4 className={styles.subSectionTitle}>Contact Information</h4>

          <div className={styles.twoColumns}>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input type="email" className={`form-input ${styles.disabledInput}`} value={user?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" name="phone" className="form-input" placeholder="+1 (555) 123-4567"
                value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <h4 className={styles.subSectionTitle}>Location</h4>

          <div className={styles.twoColumns}>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input type="text" name="country" className="form-input" placeholder="United States"
                value={formData.country} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input type="text" name="city" className="form-input" placeholder="San Francisco"
                value={formData.city} onChange={handleChange} />
            </div>
          </div>

          <h4 className={styles.subSectionTitle}>Online Presence</h4>

          <div className={styles.twoColumns}>
            <div className="form-group">
              <label className="form-label"><Linkedin size={14} /> LinkedIn Profile</label>
              <input type="text" name="linkedin" className="form-input" placeholder="https://linkedin.com/in/username"
                value={formData.linkedin} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label"><Globe size={14} /> Website</label>
              <input type="text" name="website" className="form-input" placeholder="https://yourcompany.com"
                value={formData.website} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Visibility</label>
            <select name="visibility" className="form-input" value={formData.visibility} onChange={handleChange}>
              <option value="public">Public - Visible to everyone</option>
              <option value="recruiters-only">Recruiters Only</option>
              <option value="connections-only">Connections Only</option>
              <option value="private">Private - Only me</option>
            </select>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.saveBtn}`} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecruiterDashboard;