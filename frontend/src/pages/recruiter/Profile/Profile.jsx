import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import InputField from '../../../components/InputField/InputField';
import styles from './RecruiterProfile.module.css';
import {
  Camera,
  Save,
  Globe,
  Linkedin,
  Check,
  X,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Users,
  Settings,
  User,
  ChevronDown,
  Upload,
  Loader2,
} from 'lucide-react';

const DEPARTMENTS = [
  'Human Resources',
  'Engineering',
  'Operations',
  'Marketing',
  'Sales',
  'Finance',
  'Product',
  'Customer Success',
  'Legal',
  'IT',
];

const YEARS_OF_EXPERIENCE = [
  { value: '0-1', label: '0–1 year' },
  { value: '2-3', label: '2–3 years' },
  { value: '4-6', label: '4–6 years' },
  { value: '7-10', label: '7–10 years' },
  { value: '10+', label: '10+ years' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'recruiters-only', label: 'Recruiters Only' },
  { value: 'connections-only', label: 'Connections Only' },
  { value: 'private', label: 'Private' },
];

const SKILL_SUGGESTIONS = [
  'Recruitment', 'Technical Hiring', 'Communication', 'Interviewing', 'Leadership',
  'Talent Acquisition', 'HR', 'Sourcing', 'ATS', 'LinkedIn Recruiter',
  'Candidate Assessment', 'Onboarding', 'Employer Branding', 'Diversity Hiring',
  'Contract Negotiation', 'Employee Relations', 'Performance Management',
  'Training & Development', 'Compensation', 'Benefits Administration',
  'HRIS', 'Workday', 'BambooHR', 'Greenhouse', 'Lever',
  'Python', 'JavaScript', 'React', 'Node.js', 'MongoDB',
  'Data Analysis', 'Excel', 'Power BI', 'Tableau', 'SQL',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_HEADLINE = 120;
const MAX_ABOUT = 1000;
const MAX_PHONE = 20;

const RecruiterProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [completion, setCompletion] = useState({ percentage: 0, checks: [] });
  const [resendingVerification, setResendingVerification] = useState(false);

  const avatarInputRef = useRef();
  const coverInputRef = useRef();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    summary: '',
    phone: '',
    country: '',
    stateProvince: '',
    city: '',
    jobTitle: '',
    department: '',
    yearsOfExperience: '',
    linkedin: '',
    visibility: 'public',
    skills: [],
    languages: [],
    contactPreferences: {
      allowMessages: true,
      allowConnectionRequests: true,
      showEmail: false,
      showPhone: false,
    },
  });

  const parseName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, completionRes] = await Promise.all([
        api.get('/recruiter/profile/me'),
        api.get('/recruiter/profile/completion'),
      ]);

      const profileData = profileRes.data;
      setProfile(profileData);

      const nameParts = parseName(profileData.user?.name || '');
      const prefs = profileData.user?.preferences?.privacy || {};

      setFormData({
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        headline: profileData.headline || '',
        summary: profileData.summary || '',
        phone: profileData.phone || '',
        country: profileData.location?.country || '',
        stateProvince: profileData.location?.stateProvince || '',
        city: profileData.location?.city || '',
        jobTitle: profileData.jobTitle || '',
        department: profileData.department || '',
        yearsOfExperience: profileData.yearsOfExperience?.toString() || '',
        linkedin: profileData.linkedin || '',
        visibility: profileData.visibility || 'public',
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        contactPreferences: {
          allowMessages: prefs.allowMessages ?? true,
          allowConnectionRequests: prefs.allowConnectionRequests ?? true,
          showEmail: prefs.showEmail ?? false,
          showPhone: prefs.showPhone ?? false,
        },
      });

      if (completionRes.data) {
        setCompletion(completionRes.data);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load recruiter profile:', err);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHasUnsavedChanges(true);
    if (name.startsWith('contactPreferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactPreferences: { ...prev.contactPreferences, [prefKey]: type === 'checkbox' ? checked : value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        headline: formData.headline,
        summary: formData.summary,
        phone: formData.phone,
        country: formData.country,
        stateProvince: formData.stateProvince,
        city: formData.city,
        jobTitle: formData.jobTitle,
        department: formData.department,
        yearsOfExperience: formData.yearsOfExperience,
        linkedin: formData.linkedin,
        visibility: formData.visibility,
        skills: formData.skills,
        languages: formData.languages,
      };

      const res = await api.put('/recruiter/profile', payload);
      setProfile(res.data);
      setHasUnsavedChanges(false);

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      if (fullName && user?.name !== fullName) {
        updateUser({ name: fullName });
      }

      const compRes = await api.get('/recruiter/profile/completion');
      setCompletion(compRes.data);

      showMessage('success', 'Profile saved successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showMessage('error', 'File size exceeds the 5MB limit.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.mimetype)) {
      showMessage('error', 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
      return;
    }

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    setUploading(true);
    const formData = new FormData();
    formData.append(type, file);

    try {
      const res = await api.post(`/recruiter/profile/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data);
      setHasUnsavedChanges(true);
      showMessage('success', `${type === 'avatar' ? 'Profile photo' : 'Cover image'} uploaded successfully`);
    } catch (err) {
      showMessage('error', err.response?.data?.message || `Failed to upload ${type}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (type) => {
    try {
      await api.delete(`/recruiter/profile/${type}`);
      setProfile(prev => ({ ...prev, [type]: '' }));
      setHasUnsavedChanges(true);
      showMessage('success', `${type === 'avatar' ? 'Profile photo' : 'Cover image'} removed`);
    } catch (err) {
      showMessage('error', err.response?.data?.message || `Failed to remove ${type}`);
    }
  };

  const handleAddSkill = (input) => {
    const name = typeof input === 'string' ? input.trim() : input?.name?.trim();
    if (!name) return;
    const proficiency = typeof input === 'object' ? (input.proficiency || 'intermediate') : 'intermediate';
    const exists = formData.skills.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      showMessage('error', 'This skill already exists');
      return;
    }
    if (formData.skills.length >= 30) {
      showMessage('error', 'Maximum 30 skills allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name, proficiency, pinned: false, order: prev.skills.length }],
    }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddLanguage = (name) => {
    if (!name.trim()) return;
    const exists = formData.languages.some(l => l.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      showMessage('error', 'This language already exists');
      return;
    }
    if (formData.languages.length >= 20) {
      showMessage('error', 'Maximum 20 languages allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { name: name.trim(), proficiency: 'conversational' }],
    }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  };

  const handleSkillProficiencyChange = (index, proficiency) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => i === index ? { ...s, proficiency } : s),
    }));
    setHasUnsavedChanges(true);
  };

  const handleLanguageProficiencyChange = (index, proficiency) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((l, i) => i === index ? { ...l, proficiency } : l),
    }));
    setHasUnsavedChanges(true);
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const res = await api.post('/auth/resend-verification', { email: user?.email });
      showMessage('success', res.data.message || 'Verification email sent!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await api.put('/recruiter/profile/preferences', {
        allowMessages: formData.contactPreferences.allowMessages,
        allowConnectionRequests: formData.contactPreferences.allowConnectionRequests,
        showEmail: formData.contactPreferences.showEmail,
        showPhone: formData.contactPreferences.showPhone,
        profileVisibility: formData.visibility,
      });
      showMessage('success', 'Contact preferences saved successfully');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save preferences');
    }
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'var(--success)';
    if (percentage >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Recruiter Profile</h1>
        <p className={styles.pageSubtitle}>Complete your profile to attract top student talent</p>
      </div>

      {message && (
        <div className={`${styles.toast} ${styles[message.type === 'success' ? 'toastSuccess' : 'toastError']}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className={styles.toastClose}><X size={16} /></button>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Profile Completion Bar */}
        <div className={`card ${styles.completionCard}`}>
          <div className={styles.completionHeader}>
            <h3 className={styles.completionTitle}>Profile Completion</h3>
            <span className={styles.completionPercentage} style={{ color: getCompletionColor(completion.percentage) }}>
              {completion.percentage}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${completion.percentage}%`,
                background: `linear-gradient(90deg, var(--primary), ${getCompletionColor(completion.percentage)})`,
              }}
            />
          </div>
          <div className={styles.completionChecks}>
            {completion.checks?.map((check) => (
              <div key={check.key} className={`${styles.completionCheck} ${check.passed ? styles.completionCheckPassed : styles.completionCheckFailed}`}>
                <span className={styles.completionCheckIcon}>{check.passed ? '✓' : '○'}</span>
                <span className={styles.completionCheckLabel}>{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 1: Personal Information */}
        <div className={`card ${styles.sectionCard}`}>
          <h2 className={styles.sectionTitle}>
            <User size={20} /> Personal Information
          </h2>

          {/* Cover Image */}
          <div className={styles.coverSection}>
            <div
              className={styles.coverImage}
              style={{
                backgroundImage: profile?.cover ? `url(${profile.cover})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <div className={styles.coverOverlay}>
                <button type="button" onClick={() => coverInputRef.current.click()} className={styles.coverBtn} disabled={uploadingCover}>
                  {uploadingCover ? <Loader2 size={16} className={styles.spin} /> : <Upload size={16} />}
                  {uploadingCover ? 'Uploading...' : profile?.cover ? 'Replace Cover' : 'Upload Cover'}
                </button>
                {profile?.cover && (
                  <button type="button" onClick={() => handleRemoveImage('cover')} className={styles.coverRemoveBtn}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
            <input type="file" ref={coverInputRef} onChange={(e) => handleFileUpload(e, 'cover')} accept="image/*" hidden />
          </div>

          {/* Avatar */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarFallback}>
                  {formData.firstName?.charAt(0)?.toUpperCase() || formData.lastName?.charAt(0)?.toUpperCase() || 'R'}
                </div>
              )}
              <div className={styles.avatarActions}>
                <button type="button" onClick={() => avatarInputRef.current.click()} className={styles.avatarBtn} disabled={uploadingAvatar}>
                  {uploadingAvatar ? <Loader2 size={16} className={styles.spin} /> : <Camera size={16} />}
                </button>
                {profile?.avatar && (
                  <button type="button" onClick={() => handleRemoveImage('avatar')} className={styles.avatarRemoveBtn}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input type="file" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar')} accept="image/*" hidden />
            </div>
          </div>

          <div className={styles.nameRow}>
            <InputField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              required
            />
            <InputField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Professional Headline *</label>
            <input
              type="text"
              name="headline"
              className="form-input"
              placeholder="e.g. Technical Recruiter at Google"
              value={formData.headline}
              onChange={handleChange}
              maxLength={MAX_HEADLINE}
              required
            />
            <span className={styles.charCounter}>{formData.headline.length}/{MAX_HEADLINE}</span>
          </div>

          <div className="form-group">
            <label className="form-label">About</label>
            <textarea
              name="summary"
              className={`form-input ${styles.textareaInput}`}
              placeholder="Tell students about your company, hiring focus, and what makes your team great..."
              value={formData.summary}
              onChange={handleChange}
              maxLength={MAX_ABOUT}
              rows={5}
            />
            <span className={styles.charCounter}>{formData.summary.length}/{MAX_ABOUT}</span>
          </div>

          <div className={styles.twoColumns}>
            <InputField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                name="country"
                className="form-input"
                placeholder="United States"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.twoColumns}>
            <div className="form-group">
              <label className="form-label">State / Province</label>
              <input
                type="text"
                name="stateProvince"
                className="form-input"
                placeholder="California"
                value={formData.stateProvince}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-input"
                placeholder="San Francisco"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Professional Information */}
        <div className={`card ${styles.sectionCard}`}>
          <h2 className={styles.sectionTitle}>
            <Briefcase size={20} /> Professional Information
          </h2>

          <div className={styles.twoColumns}>
            <InputField
              label="Job Title"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="Technical Recruiter"
            />
            <div className="form-group">
              <label className="form-label">Department</label>
              <select name="department" className="form-input" value={formData.department} onChange={handleChange}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <select name="yearsOfExperience" className="form-input" value={formData.yearsOfExperience} onChange={handleChange}>
              <option value="">Select experience...</option>
              {YEARS_OF_EXPERIENCE.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Skills */}
          <div className={styles.tagsSection}>
            <label className="form-label">Skills ({formData.skills.length}/30)</label>
            <div className={styles.tagsContainer}>
              {formData.skills.map((skill, index) => (
                <span key={index} className={styles.tag}>
                  <span className={styles.tagText}>{skill.name}</span>
                  <select
                    value={skill.proficiency}
                    onChange={(e) => handleSkillProficiencyChange(index, e.target.value)}
                    className={styles.tagSelect}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button type="button" onClick={() => handleRemoveSkill(index)} className={styles.tagRemove}>
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.addTagRow}>
              <input
                type="text"
                className={`form-input ${styles.addTagInput}`}
                placeholder="Add a skill..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <button type="button" onClick={(e) => { const input = e.target.previousElementSibling; handleAddSkill(input.value); input.value = ''; }} className={`btn btn-secondary ${styles.addTagBtn}`}>
                <Plus size={16} /> Add
              </button>
            </div>
            <SkillSuggestions suggestions={SKILL_SUGGESTIONS} onSelect={handleAddSkill} existingSkills={formData.skills.map(s => s.name)} />
          </div>

          {/* Languages */}
          <div className={styles.tagsSection}>
            <label className="form-label">Languages ({formData.languages.length}/20)</label>
            <div className={styles.tagsContainer}>
              {formData.languages.map((lang, index) => (
                <span key={index} className={`${styles.tag} ${styles.tagLanguage}`}>
                  <span className={styles.tagText}>{lang.name}</span>
                  <select
                    value={lang.proficiency}
                    onChange={(e) => handleLanguageProficiencyChange(index, e.target.value)}
                    className={styles.tagSelect}
                  >
                    <option value="basic">Basic</option>
                    <option value="conversational">Conversational</option>
                    <option value="professional">Professional</option>
                    <option value="native">Native</option>
                  </select>
                  <button type="button" onClick={() => handleRemoveLanguage(index)} className={styles.tagRemove}>
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.addTagRow}>
              <input
                type="text"
                className={`form-input ${styles.addTagInput}`}
                placeholder="Add a language..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLanguage(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <button type="button" onClick={(e) => { const input = e.target.previousElementSibling; handleAddLanguage(input.value); input.value = ''; }} className={`btn btn-secondary ${styles.addTagBtn}`}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><Linkedin size={14} /> LinkedIn Profile</label>
            <input
              type="text"
              name="linkedin"
              className="form-input"
              placeholder="https://linkedin.com/in/username"
              value={formData.linkedin}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Section 3: Contact Information */}
        <div className={`card ${styles.sectionCard}`}>
          <h2 className={styles.sectionTitle}>
            <Mail size={20} /> Contact Information
          </h2>

          <div className={styles.twoColumns}>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <div className={styles.emailField}>
                <input
                  type="email"
                  className={`form-input ${styles.disabledInput}`}
                  value={user?.email || ''}
                  disabled
                  readOnly
                />
                {user?.isVerified ? (
                  <span className={styles.verifiedBadge} title="Email verified">
                    <ShieldCheck size={16} /> Verified
                  </span>
                ) : (
                  <button type="button" onClick={handleResendVerification} className={styles.resendBtn} disabled={resendingVerification}>
                    {resendingVerification ? <Loader2 size={14} className={styles.spin} /> : <RefreshCw size={14} />}
                    {resendingVerification ? 'Sending...' : 'Resend Verification'}
                  </button>
                )}
              </div>
              {!user?.isVerified && (
                <p className={styles.warningText}>
                  <AlertCircle size={14} /> Please verify your email to unlock all features.
                </p>
              )}
            </div>
            <InputField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Section 4: Profile Settings */}
        <div className={`card ${styles.sectionCard}`}>
          <h2 className={styles.sectionTitle}>
            <Settings size={20} /> Profile Settings
          </h2>

          <div className="form-group">
            <label className="form-label">Profile Visibility</label>
            <select name="visibility" className="form-input" value={formData.visibility} onChange={handleChange}>
              {VISIBILITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <h3 className={styles.subSectionTitle}>Contact Preferences</h3>

          <div className={styles.preferencesGrid}>
            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <Mail size={16} /> Allow Messages
              </span>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  name="contactPreferences.allowMessages"
                  checked={formData.contactPreferences.allowMessages}
                  onChange={handleChange}
                />
                <span className={styles.toggleSlider}></span>
              </div>
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <Users size={16} /> Allow Connection Requests
              </span>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  name="contactPreferences.allowConnectionRequests"
                  checked={formData.contactPreferences.allowConnectionRequests}
                  onChange={handleChange}
                />
                <span className={styles.toggleSlider}></span>
              </div>
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <Eye size={16} /> Show Email to Connections
              </span>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  name="contactPreferences.showEmail"
                  checked={formData.contactPreferences.showEmail}
                  onChange={handleChange}
                />
                <span className={styles.toggleSlider}></span>
              </div>
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <Phone size={16} /> Show Phone Number to Connections
              </span>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  name="contactPreferences.showPhone"
                  checked={formData.contactPreferences.showPhone}
                  onChange={handleChange}
                />
                <span className={styles.toggleSlider}></span>
              </div>
            </label>
          </div>

          <button type="button" onClick={handleSavePreferences} className={`btn btn-secondary ${styles.savePrefsBtn}`}>
            <Save size={16} /> Save Preferences
          </button>
        </div>

        {/* Save Button */}
        <div className={styles.saveActions}>
          <button type="submit" className={`btn btn-primary ${styles.saveBtn}`} disabled={saving || !hasUnsavedChanges}>
            {saving ? <Loader2 size={18} className={styles.spin} /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {hasUnsavedChanges && (
            <span className={styles.unsavedText}>You have unsaved changes</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default RecruiterProfile;
