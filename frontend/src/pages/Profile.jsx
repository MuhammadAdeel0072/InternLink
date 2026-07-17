import React, { useState, useEffect, useRef } from 'react';
import ProfileCompletionBar from '../components/ProfileCompletionBar';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import {
  Camera,
  MapPin,
  Globe,
  Github,
  Linkedin,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Code
} from 'lucide-react';

const ProfilePage = () => {
  const { id } = useParams(); // Can be a specific student ID or 'me'
  const { user } = useAuth();
  const isOwnProfile = !id || id === 'me' || id === user?._id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // File Ref triggers
  const avatarInputRef = useRef();
  const coverInputRef = useRef();
  const resumeInputRef = useRef();
  const projectImgRef = useRef();

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'bio', 'education', 'experience', 'skills', 'project', 'certification'
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedItemId, setSelectedItemId] = useState(null); // ID of item being edited
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
 const [bioForm, setBioForm] = useState({
  headline: '',
  currentStatus: '',
  university: '',
  degree: '',
  major: '',
  graduationYear: '',
  summary: '',
  email: '',
  phone: '',
  website: '',
  country: '',
  city: '',
  postalCode: '',
  github: '',
  linkedin: '',
  visibility: 'public'
});

  const [eduForm, setEduForm] = useState({
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    current: false,
    grade: '',
    description: '',
    achievements: ''
  });

  const [expForm, setExpForm] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: 'Internship',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });

  const [skillsForm, setSkillsForm] = useState('');

  const [projForm, setProjForm] = useState({
    title: '',
    description: '',
    technologies: '',
    githubLink: '',
    demoLink: '',
    startDate: '',
    endDate: '',
    file: null
  });

  const [certForm, setCertForm] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const url = isOwnProfile ? '/profile/me' : `/profile/user/${id}`;
      const res = await api.get(url);
      setProfile(res.data);

      // Pre-fill forms
    setBioForm({
  headline: res.data.headline || '',
  currentStatus: res.data.currentStatus || '',
  university: res.data.university || '',
  degree: res.data.degree || '',
  major: res.data.major || '',
  graduationYear: res.data.graduationYear || '',
  summary: res.data.summary || '',
  email: res.data.email || '',
  phone: res.data.phone || '',
  website: res.data.website || '',
  country: res.data.location?.country || '',
  city: res.data.location?.city || '',
  postalCode: res.data.location?.postalCode || '',
  github: res.data.github || '',
  linkedin: res.data.linkedin || '',
  visibility: res.data.visibility || 'public'
});
      setSkillsForm(res.data.skills?.join(', ') || '');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load profile. Please make sure it is public.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  // Image Upload Triggers
  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size limit (5MB for images)
    if (file.size > 5 * 1024 * 1024 && type !== 'resume') {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append(type, file);

    try {
      setLoading(true);
      const res = await api.post(`/profile/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

const handleBioSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const payload = {
        ...bioForm,
        graduationYear: bioForm.graduationYear ? Number(bioForm.graduationYear) : undefined,
      };
      const res = await api.put('/profile', payload);
      setProfile(res.data);
      setActiveModal(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Add or Edit Education
  const handleEduSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      let res;
      if (modalMode === 'add') {
        res = await api.post('/profile/education', eduForm);
      } else {
        res = await api.put(`/profile/education/${selectedItemId}`, eduForm);
      }
      setProfile(res.data);
      setActiveModal(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEduDelete = async (eduId) => {
    if (!window.confirm('Delete this education entry?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/profile/education/${eduId}`);
      setProfile(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add or Edit Experience
  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      let res;
      if (modalMode === 'add') {
        res = await api.post('/profile/experience', expForm);
      } else {
        res = await api.put(`/profile/experience/${selectedItemId}`, expForm);
      }
      setProfile(res.data);
      setActiveModal(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleExpDelete = async (expId) => {
    if (!window.confirm('Delete this experience entry?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/profile/experience/${expId}`);
      setProfile(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update Skills
  const handleSkillsSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.put('/profile/skills', { skills: skillsForm });
      setProfile(res.data);
      setActiveModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Add or Edit Projects
  const handleProjSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', projForm.title);
      formData.append('description', projForm.description);
      formData.append('technologies', projForm.technologies);
      formData.append('githubLink', projForm.githubLink);
      formData.append('demoLink', projForm.demoLink);
      if (projForm.startDate) formData.append('startDate', projForm.startDate);
      if (projForm.endDate) formData.append('endDate', projForm.endDate);
      if (projForm.file) formData.append('projectImage', projForm.file);

      let res;
      if (modalMode === 'add') {
        res = await api.post('/profile/projects', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.put(`/profile/projects/${selectedItemId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setProfile(res.data);
      setActiveModal(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleProjDelete = async (projId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/profile/projects/${projId}`);
      setProfile(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add or Edit Certifications
  const handleCertSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      let res;
      if (modalMode === 'add') {
        res = await api.post('/profile/certifications', certForm);
      } else {
        res = await api.put(`/profile/certifications/${selectedItemId}`, certForm);
      }
      setProfile(res.data);
      setActiveModal(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCertDelete = async (certId) => {
    if (!window.confirm('Delete this certification?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/profile/certifications/${certId}`);
      setProfile(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Form Pre-fill handlers
  const openEditEdu = (edu) => {
    setModalMode('edit');
    setSelectedItemId(edu._id);
    setEduForm({
      school: edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || '',
      startDate: edu.startDate ? edu.startDate.substring(0, 10) : '',
      endDate: edu.endDate ? edu.endDate.substring(0, 10) : '',
      current: edu.current || false,
      grade: edu.grade || '',
      description: edu.description || '',
      achievements: edu.achievements || ''
    });
    setActiveModal('education');
  };

  const openAddEdu = () => {
    setModalMode('add');
    setEduForm({
      school: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      current: false,
      grade: '',
      description: '',
      achievements: ''
    });
    setActiveModal('education');
  };

  const openEditExp = (exp) => {
    setModalMode('edit');
    setSelectedItemId(exp._id);
    setExpForm({
      title: exp.title,
      company: exp.company,
      location: exp.location || '',
      employmentType: exp.employmentType || 'Internship',
      startDate: exp.startDate ? exp.startDate.substring(0, 10) : '',
      endDate: exp.endDate ? exp.endDate.substring(0, 10) : '',
      current: exp.current || false,
      description: exp.description || ''
    });
    setActiveModal('experience');
  };

  const openAddExp = () => {
    setModalMode('add');
    setExpForm({
      title: '',
      company: '',
      location: '',
      employmentType: 'Internship',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });
    setActiveModal('experience');
  };

  const openEditProj = (proj) => {
    setModalMode('edit');
    setSelectedItemId(proj._id);
    setProjForm({
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies?.join(', ') || '',
      githubLink: proj.githubLink || '',
      demoLink: proj.demoLink || '',
      startDate: proj.startDate ? proj.startDate.substring(0, 10) : '',
      endDate: proj.endDate ? proj.endDate.substring(0, 10) : '',
      file: null
    });
    setActiveModal('project');
  };

  const openAddProj = () => {
    setModalMode('add');
    setProjForm({
      title: '',
      description: '',
      technologies: '',
      githubLink: '',
      demoLink: '',
      startDate: '',
      endDate: '',
      file: null
    });
    setActiveModal('project');
  };

  const openEditCert = (cert) => {
    setModalMode('edit');
    setSelectedItemId(cert._id);
    setCertForm({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate ? cert.issueDate.substring(0, 10) : '',
      expirationDate: cert.expirationDate ? cert.expirationDate.substring(0, 10) : '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || ''
    });
    setActiveModal('certification');
  };

  const openAddCert = () => {
    setModalMode('add');
    setCertForm({
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expirationDate: '',
      credentialId: '',
      credentialUrl: ''
    });
    setActiveModal('certification');
  };

  if (loading && !profile) return <Loader fullPage />;
  if (error) return <div style={{ color: 'var(--danger)', textAlign: 'center', padding: '40px' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
        {isOwnProfile && <ProfileCompletionBar profile={profile} />}
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={(e) => handleFileChange(e, 'avatar')}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={(e) => handleFileChange(e, 'cover')}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={resumeInputRef}
        onChange={(e) => handleFileChange(e, 'resume')}
        accept=".pdf"
        style={{ display: 'none' }}
      />

      {/* Profile Header Banner Block */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px', position: 'relative' }}>
        {/* Cover Photo */}
        <div
          style={{
            height: '200px',
            backgroundColor: 'var(--bg-tertiary)',
            backgroundImage: profile.cover ? `url(${profile.cover})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          {isOwnProfile && (
            <button
              onClick={() => coverInputRef.current.click()}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: 'var(--radius-full)',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                color: '#fff'
              }}
            >
              <Camera size={16} />
            </button>
          )}
        </div>

        {/* Profile Avatar & Primary Info */}
        <div style={{ padding: '24px', position: 'relative', marginTop: '-60px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.user?.name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--bg-secondary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  border: '4px solid var(--bg-secondary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                {profile.user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current.click()}
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '6px',
                  display: 'flex',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Camera size={14} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{profile.user?.name}</h1>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1rem', marginTop: '2px' }}>
                  {profile.headline || 'No professional headline set yet'}
                </p>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', flexWrap: 'wrap' }}>
                {(profile.location?.city || profile.location?.country || profile.locationString) && (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <MapPin size={14} /> 
    {typeof profile.location === 'string' 
      ? profile.location 
      : [profile.location?.city, profile.location?.country].filter(Boolean).join(', ') || profile.locationString}
  </span>
)}
                  {profile.visibility && (
                    <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {profile.visibility} profile
                    </span>
                  )}
                </div>
              </div>

              {isOwnProfile ? (
                <button
                  onClick={() => setActiveModal('bio')}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={14} /> Edit Bio
                </button>
              ) : null}
            </div>

            {/* Social and Resume Links */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)' }}>
                  <Globe size={14} /> Website <ExternalLink size={12} />
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Github size={14} /> GitHub <ExternalLink size={12} />
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)' }}>
                  <Linkedin size={14} /> LinkedIn <ExternalLink size={12} />
                </a>
              )}
              
              {profile.resume ? (
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: 'auto' }}
                >
                  <FileText size={14} /> View Resume
                </a>
              ) : isOwnProfile ? (
                <button
                  onClick={() => resumeInputRef.current.click()}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: 'auto' }}
                >
                  <Plus size={14} /> Upload Resume (PDF)
                </button>
              ) : null}

              {isOwnProfile && profile.resume && (
                <button
                  onClick={() => resumeInputRef.current.click()}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Update
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary / About Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>About</h3>
        <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {profile.summary || 'Write a professional summary to tell recruiters about your career goals, strengths, and work experience.'}
        </p>
      </div>

      {/* Skills Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>Skills</h3>
          {isOwnProfile && (
            <button
              onClick={() => {
                setSkillsForm(profile.skills?.join(', ') || '');
                setActiveModal('skills');
              }}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Manage
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill, index) => (
              <span
                key={index}
                className="badge"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  fontSize: '0.85rem'
                }}
              >
                {skill}
              </span>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added yet.</p>
          )}
        </div>
      </div>

      {/* Experience Timeline Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
            <Briefcase size={18} style={{ color: 'var(--primary)' }} /> Experience
          </h3>
          {isOwnProfile && (
            <button onClick={openAddExp} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.experience && profile.experience.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {profile.experience.map((exp) => (
              <div key={exp._id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center' }}>
                    <Briefcase size={18} />
                  </div>
                </div>
                <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{exp.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                        {exp.company} {exp.location && `• ${exp.location}`}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Calendar size={12} />
                        {new Date(exp.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} –{' '}
                        {exp.current
                          ? 'Present'
                          : exp.endDate
                          ? new Date(exp.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
                          : ''}
                        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{exp.employmentType}</span>
                      </p>
                    </div>
                    {isOwnProfile && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditExp(exp)} style={{ color: 'var(--text-muted)', padding: '4px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleExpDelete(exp._id)} style={{ color: 'var(--danger)', padding: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {exp.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No professional experience added yet.</p>
        )}
      </div>

      {/* Education Timeline Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
            <GraduationCap size={20} style={{ color: 'var(--primary)' }} /> Education
          </h3>
          {isOwnProfile && (
            <button onClick={openAddEdu} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.education && profile.education.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {profile.education.map((edu) => (
              <div key={edu._id} style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={20} />
                </div>
                <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{edu.school}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                        {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Calendar size={12} />
                        {new Date(edu.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} –{' '}
                        {edu.current
                          ? 'Present'
                          : edu.endDate
                          ? new Date(edu.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
                          : ''}
                        {edu.grade && <span style={{ color: 'var(--text-secondary)', marginLeft: '12px' }}>GPA: {edu.grade}</span>}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditEdu(edu)} style={{ color: 'var(--text-muted)', padding: '4px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleEduDelete(edu._id)} style={{ color: 'var(--danger)', padding: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {edu.achievements && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px', fontWeight: 500 }}>
                      Achievements: <span style={{ color: 'var(--text-primary)' }}>{edu.achievements}</span>
                    </p>
                  )}
                  {edu.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No academic background added yet.</p>
        )}
      </div>

      {/* Projects Grid Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
            <Code size={18} style={{ color: 'var(--primary)' }} /> Projects
          </h3>
          {isOwnProfile && (
            <button onClick={openAddProj} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.projects && profile.projects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {profile.projects.map((proj) => (
              <div key={proj._id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
                {proj.image && (
                  <img
                    src={proj.image}
                    alt={proj.title}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{proj.title}</h4>
                  {isOwnProfile && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEditProj(proj)} style={{ color: 'var(--text-muted)', padding: '2px' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleProjDelete(proj._id)} style={{ color: 'var(--danger)', padding: '2px' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1, marginBottom: '12px' }}>
                  {proj.description}
                </p>

                {/* Tech tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                  {proj.technologies?.map((tech, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      {tech}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {proj.githubLink && (
                    <a href={proj.githubLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Github size={14} /> Repository
                    </a>
                  )}
                  {proj.demoLink && (
                    <a href={proj.demoLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--primary)', marginLeft: 'auto' }}>
                      <ExternalLink size={14} /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No portfolio projects added yet.</p>
        )}
      </div>

      {/* Certifications Section */}
      <div className="card" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
            <Award size={20} style={{ color: 'var(--primary)' }} /> Certifications
          </h3>
          {isOwnProfile && (
            <button onClick={openAddCert} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.certifications && profile.certifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profile.certifications.map((cert) => (
              <div key={cert._id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={20} />
                </div>
                <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{cert.name}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {cert.issuingOrganization}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                        Issued:{' '}
                        {new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}{' '}
                        {cert.expirationDate
                          ? `• Expires: ${new Date(cert.expirationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}`
                          : '• Does not expire'}
                      </p>
                      {cert.credentialId && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                          Credential ID: {cert.credentialId}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {cert.credentialUrl && (
                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex' }}>
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {isOwnProfile && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEditCert(cert)} style={{ color: 'var(--text-muted)' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleCertDelete(cert._id)} style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No professional certifications added yet.</p>
        )}
      </div>

      {/* --- MODALS BLOCK --- */}

      {/* Bio / Details Modal */}
      <Modal
        isOpen={activeModal === 'bio'}
        onClose={() => setActiveModal(null)}
        title="Edit Profile Information"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBioSubmit} disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleBioSubmit}>
          <InputField
            label="Professional Headline"
            name="headline"
            placeholder="Computer Science Student | Frontend Developer Intern"
            value={bioForm.headline}
            onChange={(e) => setBioForm({ ...bioForm, headline: e.target.value })}
            required
          />
          <InputField
  label="Current Status"
  name="currentStatus"
  type="select"
  value={bioForm.currentStatus}
  onChange={(e) => setBioForm({ ...bioForm, currentStatus: e.target.value })}
  options={[
    { value: '', label: 'Select status...' },
    { value: 'student', label: 'Student' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'looking-internship', label: 'Looking for Internship' },
    { value: 'looking-job', label: 'Looking for Job' },
    { value: 'employed', label: 'Employed' }
  ]}
/>

<InputField
  label="University / College"
  name="university"
  placeholder="Stanford University"
  value={bioForm.university}
  onChange={(e) => setBioForm({ ...bioForm, university: e.target.value })}
/>

<InputField
  label="Degree"
  name="degree"
  placeholder="Bachelor of Science"
  value={bioForm.degree}
  onChange={(e) => setBioForm({ ...bioForm, degree: e.target.value })}
/>

<InputField
  label="Major / Field of Study"
  name="major"
  placeholder="Computer Science"
  value={bioForm.major}
  onChange={(e) => setBioForm({ ...bioForm, major: e.target.value })}
/>

<InputField
  label="Graduation Year"
  name="graduationYear"
  type="number"
  placeholder="2026"
  value={bioForm.graduationYear}
  onChange={(e) => setBioForm({ ...bioForm, graduationYear: e.target.value })}
/>

<InputField
  label="Country"
  name="country"
  placeholder="United States"
  value={bioForm.country}
  onChange={(e) => setBioForm({ ...bioForm, country: e.target.value })}
/>

<InputField
  label="City"
  name="city"
  placeholder="San Francisco"
  value={bioForm.city}
  onChange={(e) => setBioForm({ ...bioForm, city: e.target.value })}
/>

<InputField
  label="Postal Code"
  name="postalCode"
  placeholder="94105"
  value={bioForm.postalCode}
  onChange={(e) => setBioForm({ ...bioForm, postalCode: e.target.value })}
/>

<InputField
  label="Phone"
  name="phone"
  placeholder="+1 (555) 123-4567"
  value={bioForm.phone}
  onChange={(e) => setBioForm({ ...bioForm, phone: e.target.value })}
/>

<InputField
  label="Email (Public)"
  name="email"
  type="email"
  placeholder="you@example.com"
  value={bioForm.email}
  onChange={(e) => setBioForm({ ...bioForm, email: e.target.value })}
/>
          <InputField
            label="About / Professional Summary"
            name="summary"
            type="textarea"
            placeholder="Write a brief intro..."
            value={bioForm.summary}
            onChange={(e) => setBioForm({ ...bioForm, summary: e.target.value })}
            rows={5}
          />
          <InputField
            label="Portfolio Website Link"
            name="website"
            placeholder="https://myportfolio.com"
            value={bioForm.website}
            onChange={(e) => setBioForm({ ...bioForm, website: e.target.value })}
          />
          <InputField
            label="GitHub Profile URL"
            name="github"
            placeholder="https://github.com/username"
            value={bioForm.github}
            onChange={(e) => setBioForm({ ...bioForm, github: e.target.value })}
          />
          <InputField
            label="LinkedIn Profile URL"
            name="linkedin"
            placeholder="https://linkedin.com/in/username"
            value={bioForm.linkedin}
            onChange={(e) => setBioForm({ ...bioForm, linkedin: e.target.value })}
          />
          <InputField
            label="Profile Visibility"
            name="visibility"
            type="select"
            value={bioForm.visibility}
            onChange={(e) => setBioForm({ ...bioForm, visibility: e.target.value })}
            options={[
              { value: 'public', label: 'Public (Anyone)' },
              { value: 'connections-only', label: 'Connections Only' },
              { value: 'private', label: 'Private (Only Me)' }
            ]}
          />
        </form>
      </Modal>

      {/* Education Modal */}
      <Modal
        isOpen={activeModal === 'education'}
        onClose={() => setActiveModal(null)}
        title={modalMode === 'add' ? 'Add Education' : 'Edit Education'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEduSubmit} disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleEduSubmit}>
          <InputField
            label="School / University"
            name="school"
            placeholder="Stanford University"
            value={eduForm.school}
            onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
            required
          />
          <InputField
            label="Degree"
            name="degree"
            placeholder="Bachelor of Science"
            value={eduForm.degree}
            onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
            required
          />
          <InputField
            label="Field of Study"
            name="fieldOfStudy"
            placeholder="Computer Science"
            value={eduForm.fieldOfStudy}
            onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField
              label="Start Date"
              name="startDate"
              type="date"
              value={eduForm.startDate}
              onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
              required
            />
            {!eduForm.current && (
              <InputField
                label="End Date"
                name="endDate"
                type="date"
                value={eduForm.endDate}
                onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
              />
            )}
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="edu-current"
              checked={eduForm.current}
              onChange={(e) => setEduForm({ ...eduForm, current: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="edu-current" className="form-label" style={{ margin: 0 }}>I currently study here</label>
          </div>
          <InputField
            label="Grade / GPA"
            name="grade"
            placeholder="3.8"
            value={eduForm.grade}
            onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
          />
          <InputField
            label="Key Achievements"
            name="achievements"
            placeholder="Dean's list, Hackathon winner..."
            value={eduForm.achievements}
            onChange={(e) => setEduForm({ ...eduForm, achievements: e.target.value })}
          />
          <InputField
            label="Description"
            name="description"
            type="textarea"
            placeholder="Describe courses, activities..."
            value={eduForm.description}
            onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Experience Modal */}
      <Modal
        isOpen={activeModal === 'experience'}
        onClose={() => setActiveModal(null)}
        title={modalMode === 'add' ? 'Add Experience' : 'Edit Experience'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleExpSubmit} disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleExpSubmit}>
          <InputField
            label="Job / Internship Title"
            name="title"
            placeholder="Software Engineering Intern"
            value={expForm.title}
            onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
            required
          />
          <InputField
            label="Company"
            name="company"
            placeholder="Google"
            value={expForm.company}
            onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
            required
          />
          <InputField
            label="Location"
            name="location"
            placeholder="Mountain View, CA"
            value={expForm.location}
            onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
          />
          <InputField
            label="Employment Type"
            name="employmentType"
            type="select"
            value={expForm.employmentType}
            onChange={(e) => setExpForm({ ...expForm, employmentType: e.target.value })}
            options={[
              { value: 'Internship', label: 'Internship' },
              { value: 'Part-time', label: 'Part-time' },
              { value: 'Full-time', label: 'Full-time' },
              { value: 'Contract', label: 'Contract' },
              { value: 'Freelance', label: 'Freelance' }
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField
              label="Start Date"
              name="startDate"
              type="date"
              value={expForm.startDate}
              onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
              required
            />
            {!expForm.current && (
              <InputField
                label="End Date"
                name="endDate"
                type="date"
                value={expForm.endDate}
                onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
              />
            )}
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="exp-current"
              checked={expForm.current}
              onChange={(e) => setExpForm({ ...expForm, current: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="exp-current" className="form-label" style={{ margin: 0 }}>I currently work in this role</label>
          </div>
          <InputField
            label="Description / Key Responsibilities"
            name="description"
            type="textarea"
            placeholder="List your accomplishments, tools used..."
            value={expForm.description}
            onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Skills Modal */}
      <Modal
        isOpen={activeModal === 'skills'}
        onClose={() => setActiveModal(null)}
        title="Manage Skill Tags"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSkillsSubmit} disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSkillsSubmit}>
          <InputField
            label="Enter Skills (separated by commas)"
            name="skills"
            type="textarea"
            placeholder="React, Node.js, Python, CSS Grid, Product Management"
            value={skillsForm}
            onChange={(e) => setSkillsForm(e.target.value)}
            rows={4}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Tip: Pressing save will convert commas into individual searchable tags on your profile.
          </p>
        </form>
      </Modal>

      {/* Project Modal */}
      <Modal
        isOpen={activeModal === 'project'}
        onClose={() => setActiveModal(null)}
        title={modalMode === 'add' ? 'Add Portfolio Project' : 'Edit Project'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleProjSubmit} disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleProjSubmit}>
          <InputField
            label="Project Title"
            name="title"
            placeholder="E-commerce Web App"
            value={projForm.title}
            onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
            required
          />
          <InputField
            label="Description"
            name="description"
            type="textarea"
            placeholder="What problem does this project solve? What did you build?"
            value={projForm.description}
            onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
            required
          />
          <InputField
            label="Technologies Used (comma separated)"
            name="technologies"
            placeholder="React, MongoDB, Node.js, Express"
            value={projForm.technologies}
            onChange={(e) => setProjForm({ ...projForm, technologies: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField
              label="Start Date"
              name="startDate"
              type="date"
              value={projForm.startDate}
              onChange={(e) => setProjForm({ ...projForm, startDate: e.target.value })}
            />
            <InputField
              label="End Date"
              name="endDate"
              type="date"
              value={projForm.endDate}
              onChange={(e) => setProjForm({ ...projForm, endDate: e.target.value })}
            />
          </div>
          <InputField
            label="GitHub Repository Link"
            name="githubLink"
            placeholder="https://github.com/myusername/project"
            value={projForm.githubLink}
            onChange={(e) => setProjForm({ ...projForm, githubLink: e.target.value })}
          />
          <InputField
            label="Live Demo Link"
            name="demoLink"
            placeholder="https://myproject.herokuapp.com"
            value={projForm.demoLink}
            onChange={(e) => setProjForm({ ...projForm, demoLink: e.target.value })}
          />
          
          <div className="form-group">
            <label className="form-label">Project Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProjForm({ ...projForm, file: e.target.files[0] })}
              style={{
                padding: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Certification Modal */}
      <Modal
        isOpen={activeModal === 'certification'}
        onClose={() => setActiveModal(null)}
        title={modalMode === 'add' ? 'Add Certification' : 'Edit Certification'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCertSubmit} disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCertSubmit}>
          <InputField
            label="Certification Name"
            name="name"
            placeholder="AWS Certified Solutions Architect"
            value={certForm.name}
            onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
            required
          />
          <InputField
            label="Issuing Organization"
            name="issuingOrganization"
            placeholder="Amazon Web Services"
            value={certForm.issuingOrganization}
            onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField
              label="Issue Date"
              name="issueDate"
              type="date"
              value={certForm.issueDate}
              onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
              required
            />
            <InputField
              label="Expiration Date (optional)"
              name="expirationDate"
              type="date"
              value={certForm.expirationDate}
              onChange={(e) => setCertForm({ ...certForm, expirationDate: e.target.value })}
            />
          </div>
          <InputField
            label="Credential ID"
            name="credentialId"
            placeholder="AWS-12345"
            value={certForm.credentialId}
            onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
          />
          <InputField
            label="Credential URL"
            name="credentialUrl"
            placeholder="https://credly.com/badge/example"
            value={certForm.credentialUrl}
            onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
          />
        </form>
      </Modal>

    </div>
  );
};

export default ProfilePage;
