import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import InputField from '../../../components/InputField/InputField';
import styles from './CreateCompany.module.css';
import {
  ChevronLeft,
  Upload,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Building2,
} from 'lucide-react';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Retail',
  'Manufacturing',
  'Government',
  'Telecommunications',
  'Consulting',
  'Construction',
  'Media',
  'Transportation',
  'Energy',
  'Agriculture',
  'Hospitality',
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '501-1000', label: '501–1000' },
  { value: '1001-5000', label: '1001–5000' },
  { value: '5000+', label: '5000+' },
];

const BENEFITS_OPTIONS = [
  'Remote',
  'Hybrid',
  'Flexible Hours',
  'Health Insurance',
  'Learning Budget',
  'Paid Leave',
  'Stock Options',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_COVER_SIZE = 10 * 1024 * 1024;
const MAX_DESCRIPTION = 2000;

const CreateCompany = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    website: '',
    companySize: '',
    description: '',
    country: '',
    state: '',
    city: '',
    linkedin: '',
    facebook: '',
    twitter: '',
    instagram: '',
    github: '',
    youtube: '',
    phone: '',
    supportEmail: '',
    hrEmail: '',
    benefits: [],
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const logoInputRef = useRef();
  const coverInputRef = useRef();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/recruiter/company-status');
        if (res.data.success && res.data.data.hasCompany && res.data.data.status === 'approved') {
          navigate('/recruiter/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Failed to load company status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };
    fetchStatus();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBenefitsChange = (benefit) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((b) => b !== benefit)
        : [...prev.benefits, benefit],
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Logo must be PNG, JPG, or WEBP');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Logo size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Cover image must be PNG, JPG, or WEBP');
      return;
    }

    if (file.size > MAX_COVER_SIZE) {
      setError('Cover image size must be less than 10MB');
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.companyName || !formData.industry || !formData.companySize) {
      setError('Company name, industry, and company size are required');
      return;
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      setError('Please enter a valid website URL starting with http:// or https://');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('companyName', formData.companyName);
      submitData.append('industry', formData.industry);
      submitData.append('companySize', formData.companySize);
      submitData.append('website', formData.website);
      submitData.append('description', formData.description);
      submitData.append('headquarters', JSON.stringify({
        country: formData.country,
        state: formData.state,
        city: formData.city,
      }));
      submitData.append('socialLinks', JSON.stringify({
        linkedin: formData.linkedin,
        facebook: formData.facebook,
        twitter: formData.twitter,
        instagram: formData.instagram,
        github: formData.github,
        youtube: formData.youtube,
      }));
      submitData.append('contactInformation', JSON.stringify({
        phone: formData.phone,
        supportEmail: formData.supportEmail,
        hrEmail: formData.hrEmail,
      }));
      submitData.append('benefits', JSON.stringify(formData.benefits));

      if (logoFile) {
        submitData.append('logo', logoFile);
      }
      if (coverFile) {
        submitData.append('coverImage', coverFile);
      }

      const res = await api.post('/companies', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        navigate('/recruiter/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {checkingStatus && (
        <div className={styles.loadingContainer}>
          <Loader fullPage />
        </div>
      )}
      {!checkingStatus && (
        <>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate('/recruiter/company-association')}>
              <ChevronLeft size={20} />
              Back
            </button>
            <h1 className={styles.title}>Create New Company</h1>
            <p className={styles.subtitle}>Set up your company profile and start recruiting.</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Building2 size={20} />
                Basic Information
              </h2>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Industry *</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className={styles.input}
                required
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={styles.input}
                placeholder="https://example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Company Size *</label>
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                className={styles.input}
                required
              >
                <option value="">Select company size</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Tell us about your company..."
              rows={5}
              maxLength={MAX_DESCRIPTION}
            />
            <span className={styles.charCount}>{formData.description.length}/{MAX_DESCRIPTION}</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <MapPin size={20} />
            Headquarters
          </h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={styles.input}
                placeholder="Country"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={styles.input}
                placeholder="State"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={styles.input}
                placeholder="City"
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ImageIcon size={20} />
            Company Images
          </h2>
          <div className={styles.imageGrid}>
            <div className={styles.imageUpload}>
              <label className={styles.label}>Logo</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
                className={styles.hiddenInput}
              />
              {logoPreview ? (
                <div className={styles.imagePreview}>
                  <img src={logoPreview} alt="Logo preview" className={styles.previewImage} />
                  <div className={styles.imageActions}>
                    <button type="button" className={styles.iconButton} onClick={() => logoInputRef.current?.click()}>
                      <Upload size={16} />
                      Replace
                    </button>
                    <button type="button" className={styles.iconButtonDanger} onClick={removeLogo}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className={styles.uploadButton} onClick={() => logoInputRef.current?.click()}>
                  <Upload size={24} />
                  <span>Upload Logo</span>
                  <span className={styles.uploadHint}>PNG, JPG, WEBP (max 5MB)</span>
                </button>
              )}
            </div>

            <div className={styles.imageUpload}>
              <label className={styles.label}>Cover Image</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverChange}
                className={styles.hiddenInput}
              />
              {coverPreview ? (
                <div className={styles.imagePreview}>
                  <img src={coverPreview} alt="Cover preview" className={styles.coverPreviewImage} />
                  <div className={styles.imageActions}>
                    <button type="button" className={styles.iconButton} onClick={() => coverInputRef.current?.click()}>
                      <Upload size={16} />
                      Replace
                    </button>
                    <button type="button" className={styles.iconButtonDanger} onClick={removeCover}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className={styles.uploadButton} onClick={() => coverInputRef.current?.click()}>
                  <Upload size={24} />
                  <span>Upload Cover Image</span>
                  <span className={styles.uploadHint}>PNG, JPG, WEBP (max 10MB)</span>
                </button>
              )}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ExternalLink size={20} />
            Social Links
          </h2>
          <div className={styles.formGrid}>
            {[
              { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
              { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
              { name: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/...' },
              { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
              { name: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
              { name: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
            ].map((social) => (
              <div className={styles.formGroup} key={social.name}>
                <label className={styles.label}>{social.label}</label>
                <input
                  type="url"
                  name={social.name}
                  value={formData[social.name]}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder={social.placeholder}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Contact Information
          </h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={styles.input}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Support Email</label>
              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                className={styles.input}
                placeholder="support@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>HR Email</label>
              <input
                type="email"
                name="hrEmail"
                value={formData.hrEmail}
                onChange={handleChange}
                className={styles.input}
                placeholder="hr@example.com"
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Company Culture</h2>
          <p className={styles.sectionDescription}>Select benefits and work culture options offered by your company.</p>
          <div className={styles.benefitsGrid}>
            {BENEFITS_OPTIONS.map((benefit) => (
              <button
                key={benefit}
                type="button"
                className={`${styles.benefitChip} ${formData.benefits.includes(benefit) ? styles.benefitChipActive : ''}`}
                onClick={() => handleBenefitsChange(benefit)}
              >
                {formData.benefits.includes(benefit) && <CheckCircle2 size={16} />}
                {benefit}
              </button>
            ))}
          </div>
        </section>

        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => navigate('/recruiter/company-association')}>
            Cancel
          </button>
          <button type="submit" className={styles.primaryButton} disabled={loading}>
            {loading ? 'Creating Company...' : 'Create Company'}
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
};

export default CreateCompany;
