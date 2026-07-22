import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/InputField/InputField';
import SkillSuggestions from '../../components/SkillSuggestions/SkillSuggestions';
import CollapsibleText from '../../components/CollapsibleText/CollapsibleText';
import styles from './Profile.module.css';
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
  Code,
  MessageSquare,
  UserPlus,
  Check,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
 
  const [profile, setProfile] = useState({
    skills: [],
    languages: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionId, setConnectionId] = useState(null);

  // File Ref triggers
  const avatarInputRef = useRef();
  const coverInputRef = useRef();
  const resumeInputRef = useRef();
  const projectImgRef = useRef();

  // Modals state
  const [activeModal, setActiveModal] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [selectedItemId, setSelectedItemId] = useState(null);
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
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const ownProfile = !userId || 
                       userId === 'me' || 
                       String(userId) === String(storedUser?._id);
      const url = ownProfile ? '/profile/me' : `/profile/user/${userId}`;
      console.log('🔍 FETCHING:', { userId, ownProfile, url });
      const res = await api.get(url);
      setProfile(res.data);

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
      setError(null);
    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError('Could not load profile. Please make sure it is public.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwnProfile && profile?.user?._id) {
      checkConnectionStatus();
    }
  }, [profile?.user?._id, isOwnProfile]);

  const checkConnectionStatus = async () => {
    try {
      const res = await api.get('/connections');
      const connections = res.data;
      const existing = connections.find(c => c._id === profile.user._id);
      if (existing) {
        setConnectionStatus('accepted');
        return;
      }
      setConnectionStatus('none');
    } catch (err) {
      setConnectionStatus('none');
    }
  };

  const handleConnect = async () => {
    try {
      await api.post(`/connections/request/${profile.user._id}`);
      setConnectionStatus('pending');
      alert('Connection request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleMessage = async () => {
    try {
      const res = await api.post(`/messages/conversation/${profile.user._id}`);
      navigate(`/messages`);
    } catch (err) {
      alert('Failed to start conversation');
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.user?._id}`);
    alert('Profile link copied!');
  };

  useEffect(() => {
  const ownProfile = !userId || 
                     userId === 'me' || 
                     String(userId) === String(storedUser?._id);
  setIsOwnProfile(ownProfile);
  console.log('🔍 DEBUG:', { 
    userId, 
    storedUserId: storedUser?._id, 
    ownProfile,
    userIdType: typeof userId,
    storedUserIdType: typeof storedUser?._id
  });
  fetchProfile();
}, [userId]);

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

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

  // Skill Handlers
  const handleAddSkill = async (name, proficiency = 'intermediate') => {
    try {
      const existingSkill = profile.skills?.find(s => {
        const skillName = typeof s === 'object' ? s.name : s;
        return skillName.toLowerCase() === name.toLowerCase();
      });
      
      if (existingSkill) {
        alert(`${name} already exists in your skills!`);
        return;
      }

      const newSkill = {
        name: name,
        proficiency: proficiency,
        pinned: false,
        order: profile.skills?.length || 0
      };

      const updatedSkills = [...(profile.skills || []).map(s => 
        typeof s === 'object' ? s : { name: s, proficiency: 'intermediate', pinned: false, order: 0 }
      ), newSkill];

      const res = await api.put('/profile/skills', { skills: updatedSkills });
      setProfile(res.data);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async (search) => {
      const dropdown = document.getElementById('skill-suggestions-dropdown');
      if (!dropdown) return;

      try {
        const res = await api.get(`/profile/skills/suggestions?search=${search}`);
        const existingNames = (profile.skills || []).map(s => 
          typeof s === 'object' ? s.name?.toLowerCase() : s?.toLowerCase()
        );
        const filtered = (res.data || []).filter(s => !existingNames.includes(s.toLowerCase()));

        if (filtered.length > 0) {
          dropdown.innerHTML = filtered.map(skill => `
            <div 
              class="skill-suggestion-item"
              data-skill="${skill}"
            >${skill}</div>
          `).join('');
          dropdown.style.display = 'block';
          
          dropdown.querySelectorAll('.skill-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
              const skillName = item.getAttribute('data-skill');
              const proficiency = document.getElementById('new-skill-proficiency')?.value || 'intermediate';
              handleAddSkill(skillName, proficiency);
              document.getElementById('skill-search-input').value = '';
              dropdown.style.display = 'none';
            });
          });
        } else {
          dropdown.style.display = 'none';
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        dropdown.style.display = 'none';
      }
    };

    const handleSearch = (e) => {
      const search = e.detail;
      if (search.length >= 1) {
        fetchSuggestions(search);
      } else {
        const dropdown = document.getElementById('skill-suggestions-dropdown');
        if (dropdown) dropdown.style.display = 'none';
      }
    };

    document.addEventListener('skill-search', handleSearch);

    const handleClickOutside = (e) => {
      const dropdown = document.getElementById('skill-suggestions-dropdown');
      const searchInput = document.getElementById('skill-search-input');
      if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
        dropdown.style.display = 'none';
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('skill-search', handleSearch);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profile]);

  if (loading && !profile) return <Loader fullPage />;
  if (error) return <div className={styles.errorContainer}>{error}</div>;
  
  return (
    <div className={styles.profileContainer}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={(e) => handleFileChange(e, 'avatar')}
        accept="image/*"
        className={styles.hiddenInput}
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={(e) => handleFileChange(e, 'cover')}
        accept="image/*"
        className={styles.hiddenInput}
      />
      <input
        type="file"
        ref={resumeInputRef}
        onChange={(e) => handleFileChange(e, 'resume')}
        accept=".pdf"
        className={styles.hiddenInput}
      />

      {/* Profile Header Banner Block */}
      <div className={`card ${styles.profileHeader}`}>
        {/* Cover Photo */}
        <div
          className={styles.coverPhoto}
          style={{
            backgroundImage: profile.cover ? `url(${profile.cover})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {isOwnProfile && (
            <button
              onClick={() => coverInputRef.current.click()}
              className={styles.coverBtn}
            >
              <Camera size={14} /> Change Cover
            </button>
          )}
        </div>

        {/* Profile Info Section */}
        <div className={styles.profileInfo}>
          <div className={styles.profileInfoRow}>
            {/* Avatar */}
            <div className={styles.avatarWrapper}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.user?.name}
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {profile.user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current.click()}
                  className={styles.avatarEditBtn}
                >
                  <Camera size={14} className={styles.avatarEditIcon} />
                </button>
              )}
            </div>

            {/* Name and Details */}
            <div className={styles.userDetails}>
              <h1 className={styles.userName}>
                {profile.user?.name || 'Your Name'}
              </h1>
              <p className={styles.userHeadline}>
                {profile.headline || 'Add a professional headline'}
              </p>
              <div className={styles.userMeta}>
                {(profile.location?.city || profile.location?.country) && (
                  <span className={styles.metaItem}>
                    <MapPin size={14} />
                    {[profile.location?.city, profile.location?.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {profile.university && (
                  <span className={styles.metaItem}>
                    <GraduationCap size={14} />
                    {profile.university}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              {isOwnProfile ? (
                <button onClick={() => setActiveModal('bio')} className={styles.editProfileBtn}>
                  <Edit2 size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  {connectionStatus === 'accepted' ? (
                    <button className={styles.connectedBtn}>
                      <Check size={14} /> Connected
                    </button>
                  ) : connectionStatus === 'pending' ? (
                    <button className={styles.pendingBtn}>
                      Request Sent
                    </button>
                  ) : (
                    <button onClick={handleConnect} className={styles.connectBtn}>
                      <UserPlus size={14} /> Connect
                    </button>
                  )}
                  <button onClick={handleMessage} className={styles.messageBtn}>
                    <MessageSquare size={14} /> Message
                  </button>
                  <button onClick={handleShareProfile} className={styles.shareBtn}>
                    <Share2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Links Section */}
          <div className={styles.linksSection}>
            <div className={styles.linksList}>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                  <Globe size={14} /> Website
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                  <Github size={14} /> GitHub
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
            </div>

            <div className={styles.resumeWrapper}>
              {profile.resume ? (
                <a href={profile.resume} target="_blank" rel="noopener noreferrer" className={styles.resumeBtn}>
                  <FileText size={14} /> View Resume
                </a>
              ) : isOwnProfile ? (
                <button onClick={() => resumeInputRef.current.click()} className={styles.uploadResumeBtn}>
                  <Plus size={14} /> Upload Resume
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Summary / About Section */}
      <div className={`card ${styles.sectionCard}`}>
        <h3 className={styles.sectionTitle}>About</h3>
        <CollapsibleText 
          text={profile.summary} 
          maxHeight={80}
          placeholder="Write a professional summary to tell recruiters about your career goals, strengths, and work experience."
        />
      </div>
      
      {/* Skills Section */}
      <div className={`card ${styles.sectionCard}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Skills</h3>
          {isOwnProfile && (
            <button onClick={() => setActiveModal('skills')} className={`btn btn-secondary ${styles.sectionActionBtn}`}>
              Manage
            </button>
          )}
        </div>
        <div className={styles.skillsContainer}>
          {profile.skills && profile.skills.length > 0 ? (
            [...profile.skills]
              .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
              .map((skill, index) => {
                const isObject = typeof skill === 'object';
                const name = isObject ? skill.name : skill;
                const proficiency = isObject ? skill.proficiency : 'intermediate';
                const pinned = isObject ? skill.pinned : false;
                const stars = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }[proficiency] || 2;
                
                return (
                  <span key={skill._id || index} className={`${styles.skillTag} ${pinned ? styles.skillTagPinned : ''}`}>
                    {pinned && <span className={styles.pinIcon}>📌</span>}
                    <span>{name}</span>
                    <span className={styles.skillStars}>
                      {'⭐'.repeat(stars)}{'☆'.repeat(4 - stars)}
                    </span>
                  </span>
                );
              })
          ) : (
            <p className={styles.emptyText}>No skills added yet.</p>
          )}
        </div>
      </div>

      {/* Languages Section */}
      <div className={`card ${styles.sectionCard}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Languages</h3>
          {isOwnProfile && (
            <button onClick={() => setActiveModal('language')} className={`btn btn-secondary ${styles.sectionActionBtn}`}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>
        
        <CollapsibleText maxHeight={80} placeholder="No languages added yet.">
          <div className={styles.languagesContainer}>
            {profile.languages && profile.languages.length > 0 ? (
              profile.languages.map((lang) => (
                <span key={lang._id} className={styles.languageTag}>
                  <span>{lang.name}</span>
                  <span className={styles.languageProficiency}>
                    {lang.proficiency}
                  </span>
                  {isOwnProfile && (
                    <button onClick={async () => {
                      if (!window.confirm(`Remove ${lang.name}?`)) return;
                      try {
                        const res = await api.delete(`/profile/languages/${lang._id}`);
                        setProfile(res.data);
                      } catch (err) {
                        alert(err.message);
                      }
                    }} className={styles.languageDeleteBtn}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <p className={styles.emptyText}>No languages added yet.</p>
            )}
          </div>
        </CollapsibleText>
      </div>

      {/* Experience Section */}
      <div className={`card ${styles.sectionCard}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Briefcase size={18} className={styles.sectionIcon} /> Experience
          </h3>
          {isOwnProfile && (
            <button onClick={openAddExp} className={`btn btn-secondary ${styles.sectionActionBtn}`}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.experience && profile.experience.length > 0 ? (
          <div className={styles.experienceList}>
            {profile.experience.map((exp) => (
              <div key={exp._id} className={styles.experienceItem}>
                <div className={styles.experienceIcon}>
                  <Briefcase size={18} />
                </div>
                <div className={styles.experienceContent}>
                  <div className={styles.experienceHeader}>
                    <div>
                      <h4 className={styles.experienceTitle}>{exp.title}</h4>
                      <p className={styles.experienceCompany}>
                        {exp.company} {exp.location && `• ${exp.location}`}
                      </p>
                      <p className={styles.experienceDate}>
                        <Calendar size={12} />
                        {new Date(exp.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} –{' '}
                        {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : ''}
                        <span className={`badge badge-success ${styles.experienceBadge}`}>{exp.employmentType}</span>
                      </p>
                    </div>
                    {isOwnProfile && (
                      <div className={styles.itemActions}>
                        <button onClick={() => openEditExp(exp)} className={styles.editBtn}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleExpDelete(exp._id)} className={styles.deleteBtn}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {exp.description && (
                    <p className={styles.experienceDescription}>
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No professional experience added yet.</p>
        )}
      </div>

      {/* Education Section */}
      <div className={`card ${styles.sectionCard}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <GraduationCap size={20} className={styles.sectionIcon} /> Education
          </h3>
          {isOwnProfile && (
            <button onClick={openAddEdu} className={`btn btn-secondary ${styles.sectionActionBtn}`}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.education && profile.education.length > 0 ? (
          <div className={styles.educationList}>
            {profile.education.map((edu) => (
              <div key={edu._id} className={styles.educationItem}>
                <div className={styles.educationIcon}>
                  <GraduationCap size={20} />
                </div>
                <div className={styles.educationContent}>
                  <div className={styles.educationHeader}>
                    <div>
                      <h4 className={styles.educationSchool}>{edu.school}</h4>
                      <p className={styles.educationDegree}>
                        {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </p>
                      <p className={styles.educationDate}>
                        <Calendar size={12} />
                        {new Date(edu.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} –{' '}
                        {edu.current ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : ''}
                        {edu.grade && <span className={styles.educationGrade}>GPA: {edu.grade}</span>}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <div className={styles.itemActions}>
                        <button onClick={() => openEditEdu(edu)} className={styles.editBtn}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleEduDelete(edu._id)} className={styles.deleteBtn}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {edu.achievements && (
                    <p className={styles.educationAchievements}>
                      Achievements: <span>{edu.achievements}</span>
                    </p>
                  )}
                  {edu.description && (
                    <p className={styles.educationDescription}>
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No academic background added yet.</p>
        )}
      </div>

      {/* Projects Section */}
      <div className={`card ${styles.sectionCard}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Code size={18} className={styles.sectionIcon} /> Projects
          </h3>
          {isOwnProfile && (
            <button onClick={openAddProj} className={`btn btn-secondary ${styles.sectionActionBtn}`}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.projects && profile.projects.length > 0 ? (
          <div className={styles.projectsGrid}>
            {profile.projects.map((proj) => (
              <div key={proj._id} className={`card ${styles.projectCard}`}>
                {proj.image && (
                  <img src={proj.image} alt={proj.title} className={styles.projectImage} />
                )}
                <div className={styles.projectHeader}>
                  <h4 className={styles.projectTitle}>{proj.title}</h4>
                  {isOwnProfile && (
                    <div className={styles.projectActions}>
                      <button onClick={() => openEditProj(proj)} className={styles.editBtn}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleProjDelete(proj._id)} className={styles.deleteBtn}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <p className={styles.projectDescription}>
                  {proj.description}
                </p>
                <div className={styles.projectTechnologies}>
                  {proj.technologies?.map((tech, idx) => (
                    <span key={idx} className={styles.techTag}>
                      {tech}
                    </span>
                  ))}
                </div>
                <div className={styles.projectLinks}>
                  {proj.githubLink && (
                    <a href={proj.githubLink} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                      <Github size={14} /> Repository
                    </a>
                  )}
                  {proj.demoLink && (
                    <a href={proj.demoLink} target="_blank" rel="noopener noreferrer" className={`${styles.projectLink} ${styles.projectLinkDemo}`}>
                      <ExternalLink size={14} /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No portfolio projects added yet.</p>
        )}
      </div>

      {/* Certifications Section */}
      <div className={`card ${styles.sectionCard}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Award size={20} className={styles.sectionIcon} /> Certifications
          </h3>
          {isOwnProfile && (
            <button onClick={openAddCert} className={`btn btn-secondary ${styles.sectionActionBtn}`}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {profile.certifications && profile.certifications.length > 0 ? (
          <div className={styles.certificationsList}>
            {profile.certifications.map((cert) => (
              <div key={cert._id} className={styles.certificationItem}>
                <div className={styles.certificationIcon}>
                  <Award size={20} />
                </div>
                <div className={styles.certificationContent}>
                  <div className={styles.certificationHeader}>
                    <div>
                      <h4 className={styles.certificationName}>{cert.name}</h4>
                      <p className={styles.certificationOrg}>
                        {cert.issuingOrganization}
                      </p>
                      <p className={styles.certificationDate}>
                        Issued: {new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                        {cert.expirationDate ? ` • Expires: ${new Date(cert.expirationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}` : ' • Does not expire'}
                      </p>
                      {cert.credentialId && (
                        <p className={styles.certificationId}>
                          Credential ID: {cert.credentialId}
                        </p>
                      )}
                    </div>
                    <div className={styles.certificationActions}>
                      {cert.credentialUrl && (
                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className={styles.certificationLink}>
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {isOwnProfile && (
                        <div className={styles.itemActions}>
                          <button onClick={() => openEditCert(cert)} className={styles.editBtn}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleCertDelete(cert._id)} className={styles.deleteBtn}>
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
          <p className={styles.emptyText}>No professional certifications added yet.</p>
        )}
      </div>
      
      {/* Skills Modal */}
      <Modal isOpen={activeModal === 'skills'} onClose={() => setActiveModal(null)} title="Manage Skills" footer={<button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Done</button>}>
        <div className={styles.skillsModal}>
          <div className={styles.skillsAddSection}>
            <label className="form-label">Add a Skill</label>
            <div className={styles.skillSearchWrapper}>
              <input id="skill-search-input" type="text" className="form-input" placeholder="Search or type a skill name..."
                onChange={(e) => { const event = new CustomEvent('skill-search', { detail: e.target.value }); document.dispatchEvent(event); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const name = e.target.value.trim(); if (!name) return; const proficiency = document.getElementById('new-skill-proficiency')?.value || 'intermediate'; handleAddSkill(name, proficiency); e.target.value = ''; } }} />
              <div id="skill-suggestions-dropdown" className={styles.skillSuggestionsDropdown} />
            </div>
            <div className={styles.skillProficiencyRow}>
              <label className="form-label">Proficiency:</label>
              <select id="new-skill-proficiency" className="form-input" defaultValue="intermediate">
                <option value="beginner">⭐ Beginner</option>
                <option value="intermediate">⭐⭐ Intermediate</option>
                <option value="advanced">⭐⭐⭐ Advanced</option>
                <option value="expert">⭐⭐⭐⭐ Expert</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => {
              const input = document.getElementById('skill-search-input'); const name = input?.value.trim(); if (!name) { alert('Please enter a skill name'); return; }
              const proficiency = document.getElementById('new-skill-proficiency')?.value || 'intermediate';
              handleAddSkill(name, proficiency); input.value = ''; input.focus();
            }}><Plus size={16} /> Add Skill</button>
          </div>
          <div>
            <label className="form-label">Your Skills ({profile.skills?.length || 0})</label>
            <div className={styles.skillsListModal}>
              {profile.skills && profile.skills.length > 0 ? (
                [...profile.skills].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.order || 0) - (b.order || 0)).map((skill) => {
                  const isObject = typeof skill === 'object'; const skillId = isObject ? skill._id : skill; const name = isObject ? skill.name : skill;
                  const proficiency = isObject ? (skill.proficiency || 'intermediate') : 'intermediate'; const pinned = isObject ? (skill.pinned || false) : false;
                  return (
                    <div key={skillId} className={`${styles.skillItem} ${pinned ? styles.skillItemPinned : ''}`}>
                      <div className={styles.skillItemInfo}>
                        {pinned && <span>📌</span>}
                        <span className={styles.skillItemName}>{name}</span>
                        <select value={proficiency} onChange={async (e) => {
                          const updated = (profile.skills || []).map(s => {
                            const sId = typeof s === 'object' ? s._id : s; const sName = typeof s === 'object' ? s.name : s;
                            if ((typeof skill === 'object' && sId === skill._id) || sName === name) {
                              return typeof s === 'object' ? { ...s, proficiency: e.target.value } : { name: s, proficiency: e.target.value };
                            } return s;
                          });
                          try { const res = await api.put('/profile/skills', { skills: updated }); setProfile(res.data); } catch (err) { alert(err.message); }
                        }} className={styles.skillProficiencySelect}>
                          <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option>
                        </select>
                      </div>
                      <div className={styles.skillItemActions}>
                        <button onClick={async () => { try { const res = await api.put(`/profile/skills/${skillId}/pin`); setProfile(res.data); } catch (err) { alert(err.message); } }} className={styles.pinBtn} title={pinned ? 'Unpin skill' : 'Pin to top'}>📌</button>
                        <button onClick={async () => { if (!window.confirm(`Remove "${name}" from skills?`)) return; try { const res = await api.delete(`/profile/skills/${skillId}`); setProfile(res.data); } catch (err) { alert(err.message); } }} className={styles.removeSkillBtn}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noSkills}>
                  <p>No skills added yet</p>
                  <p>Use the search above to add your first skill</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Bio / Edit Profile Modal */}
      <Modal isOpen={activeModal === 'bio'} onClose={() => setActiveModal(null)} title="Edit Profile" footer={<><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleBioSubmit} disabled={modalLoading}>{modalLoading ? 'Saving...' : 'Save'}</button></>}>
        <form onSubmit={handleBioSubmit}>
          <InputField label="Professional Headline" name="headline" placeholder="Software Engineer | CS Student" value={bioForm.headline} onChange={(e) => setBioForm({...bioForm, headline: e.target.value})} />
          <InputField label="Current Status" name="currentStatus" type="select" value={bioForm.currentStatus} onChange={(e) => setBioForm({...bioForm, currentStatus: e.target.value})} options={[{value: '', label: 'Select status...'}, {value: 'student', label: 'Student'}, {value: 'graduate', label: 'Graduate'}, {value: 'looking-internship', label: 'Looking for Internship'}, {value: 'looking-job', label: 'Looking for Job'}, {value: 'employed', label: 'Employed'}]} />
          <div className={styles.twoColumnGrid}>
            <InputField label="University" name="university" value={bioForm.university} onChange={(e) => setBioForm({...bioForm, university: e.target.value})} />
            <InputField label="Degree" name="degree" value={bioForm.degree} onChange={(e) => setBioForm({...bioForm, degree: e.target.value})} />
          </div>
          <InputField label="Major" name="major" value={bioForm.major} onChange={(e) => setBioForm({...bioForm, major: e.target.value})} />
          <InputField label="Graduation Year" name="graduationYear" type="number" value={bioForm.graduationYear} onChange={(e) => setBioForm({...bioForm, graduationYear: e.target.value})} />
          <InputField label="Professional Summary" name="summary" type="textarea" placeholder="Brief overview of your career goals and strengths..." value={bioForm.summary} onChange={(e) => setBioForm({...bioForm, summary: e.target.value})} />
          <InputField label="Email" name="email" type="email" value={bioForm.email} onChange={(e) => setBioForm({...bioForm, email: e.target.value})} />
          <InputField label="Phone" name="phone" value={bioForm.phone} onChange={(e) => setBioForm({...bioForm, phone: e.target.value})} />
          <InputField label="Website" name="website" placeholder="https://yourportfolio.com" value={bioForm.website} onChange={(e) => setBioForm({...bioForm, website: e.target.value})} />
          <h4 className={styles.modalSubtitle}>Location</h4>
          <div className={styles.twoColumnGrid}>
            <InputField label="Country" name="country" value={bioForm.country} onChange={(e) => setBioForm({...bioForm, country: e.target.value})} />
            <InputField label="City" name="city" value={bioForm.city} onChange={(e) => setBioForm({...bioForm, city: e.target.value})} />
          </div>
          <InputField label="Postal Code" name="postalCode" value={bioForm.postalCode} onChange={(e) => setBioForm({...bioForm, postalCode: e.target.value})} />
          <h4 className={styles.modalSubtitle}>Social Links</h4>
          <InputField label="GitHub URL" name="github" value={bioForm.github} onChange={(e) => setBioForm({...bioForm, github: e.target.value})} />
          <InputField label="LinkedIn URL" name="linkedin" value={bioForm.linkedin} onChange={(e) => setBioForm({...bioForm, linkedin: e.target.value})} />
          <InputField label="Profile Visibility" name="visibility" type="select" value={bioForm.visibility} onChange={(e) => setBioForm({...bioForm, visibility: e.target.value})} options={[{value: 'public', label: 'Public'}, {value: 'connections-only', label: 'Connections Only'}, {value: 'recruiters-only', label: 'Recruiters Only'}, {value: 'private', label: 'Private'}]} />
        </form>
      </Modal>

      {/* Languages Modal */}
      <Modal isOpen={activeModal === 'language'} onClose={() => setActiveModal(null)} title="Add Language" footer={<><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button><button className="btn btn-primary" onClick={async () => { const name = document.getElementById('lang-name').value; const proficiency = document.getElementById('lang-proficiency').value; if (!name) return alert('Language name is required'); try { const res = await api.post('/profile/languages', { name, proficiency }); setProfile(res.data); setActiveModal(null); } catch (err) { alert(err.message); } }}>Add</button></>}>
        <div>
          <div className="form-group"><label className="form-label">Language</label><input id="lang-name" className="form-input" placeholder="English, Urdu, Arabic..." /></div>
          <div className="form-group"><label className="form-label">Proficiency</label><select id="lang-proficiency" className="form-input"><option value="basic">Basic</option><option value="conversational" selected>Conversational</option><option value="professional">Professional</option><option value="native">Native</option></select></div>
        </div>
      </Modal>

      {/* Education Modal */}
      <Modal isOpen={activeModal === 'education'} onClose={() => setActiveModal(null)} title={modalMode === 'add' ? 'Add Education' : 'Edit Education'} footer={<><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleEduSubmit} disabled={modalLoading}>{modalLoading ? 'Saving...' : 'Save'}</button></>}>
        <form onSubmit={handleEduSubmit}>
          <InputField label="School / University" name="school" placeholder="Stanford University" value={eduForm.school} onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })} required />
          <InputField label="Degree" name="degree" placeholder="Bachelor of Science" value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} required />
          <InputField label="Field of Study" name="fieldOfStudy" placeholder="Computer Science" value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} />
          <div className={styles.twoColumnGrid}>
            <InputField label="Start Date" name="startDate" type="date" value={eduForm.startDate} onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })} required />
            {!eduForm.current && <InputField label="End Date" name="endDate" type="date" value={eduForm.endDate} onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })} />}
          </div>
          <div className={styles.checkboxRow}>
            <input type="checkbox" id="edu-current" checked={eduForm.current} onChange={(e) => setEduForm({ ...eduForm, current: e.target.checked })} />
            <label htmlFor="edu-current" className="form-label">I currently study here</label>
          </div>
          <InputField label="Grade / GPA" name="grade" placeholder="3.8" value={eduForm.grade} onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })} />
          <InputField label="Key Achievements" name="achievements" placeholder="Dean's list, Hackathon winner..." value={eduForm.achievements} onChange={(e) => setEduForm({ ...eduForm, achievements: e.target.value })} />
          <InputField label="Description" name="description" type="textarea" placeholder="Describe courses, activities..." value={eduForm.description} onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })} />
        </form>
      </Modal>

      {/* Experience Modal */}
      <Modal isOpen={activeModal === 'experience'} onClose={() => setActiveModal(null)} title={modalMode === 'add' ? 'Add Experience' : 'Edit Experience'} footer={<><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleExpSubmit} disabled={modalLoading}>{modalLoading ? 'Saving...' : 'Save'}</button></>}>
        <form onSubmit={handleExpSubmit}>
          <InputField label="Job / Internship Title" name="title" placeholder="Software Engineering Intern" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} required />
          <InputField label="Company" name="company" placeholder="Google" value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} required />
          <InputField label="Location" name="location" placeholder="Mountain View, CA" value={expForm.location} onChange={(e) => setExpForm({ ...expForm, location: e.target.value })} />
          <InputField label="Employment Type" name="employmentType" type="select" value={expForm.employmentType} onChange={(e) => setExpForm({ ...expForm, employmentType: e.target.value })} options={[{ value: 'Internship', label: 'Internship' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Full-time', label: 'Full-time' }, { value: 'Contract', label: 'Contract' }, { value: 'Freelance', label: 'Freelance' }]} />
          <div className={styles.twoColumnGrid}>
            <InputField label="Start Date" name="startDate" type="date" value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} required />
            {!expForm.current && <InputField label="End Date" name="endDate" type="date" value={expForm.endDate} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} />}
          </div>
          <div className={styles.checkboxRow}>
            <input type="checkbox" id="exp-current" checked={expForm.current} onChange={(e) => setExpForm({ ...expForm, current: e.target.checked })} />
            <label htmlFor="exp-current" className="form-label">I currently work in this role</label>
          </div>
          <InputField label="Description / Key Responsibilities" name="description" type="textarea" placeholder="List your accomplishments, tools used..." value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
        </form>
      </Modal>

      {/* Project Modal */}
      <Modal isOpen={activeModal === 'project'} onClose={() => setActiveModal(null)} title={modalMode === 'add' ? 'Add Portfolio Project' : 'Edit Project'} footer={<><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleProjSubmit} disabled={modalLoading}>{modalLoading ? 'Saving...' : 'Save'}</button></>}>
        <form onSubmit={handleProjSubmit}>
          <InputField label="Project Title" name="title" placeholder="E-commerce Web App" value={projForm.title} onChange={(e) => setProjForm({ ...projForm, title: e.target.value })} required />
          <InputField label="Description" name="description" type="textarea" placeholder="What problem does this project solve? What did you build?" value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} required />
          <InputField label="Technologies Used (comma separated)" name="technologies" placeholder="React, MongoDB, Node.js, Express" value={projForm.technologies} onChange={(e) => setProjForm({ ...projForm, technologies: e.target.value })} />
          <div className={styles.twoColumnGrid}>
            <InputField label="Start Date" name="startDate" type="date" value={projForm.startDate} onChange={(e) => setProjForm({ ...projForm, startDate: e.target.value })} />
            <InputField label="End Date" name="endDate" type="date" value={projForm.endDate} onChange={(e) => setProjForm({ ...projForm, endDate: e.target.value })} />
          </div>
          <InputField label="GitHub Repository Link" name="githubLink" placeholder="https://github.com/myusername/project" value={projForm.githubLink} onChange={(e) => setProjForm({ ...projForm, githubLink: e.target.value })} />
          <InputField label="Live Demo Link" name="demoLink" placeholder="https://myproject.herokuapp.com" value={projForm.demoLink} onChange={(e) => setProjForm({ ...projForm, demoLink: e.target.value })} />
          <div className="form-group">
            <label className="form-label">Project Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => setProjForm({ ...projForm, file: e.target.files[0] })} className={styles.fileInput} />
          </div>
        </form>
      </Modal>

      {/* Certification Modal */}
      <Modal isOpen={activeModal === 'certification'} onClose={() => setActiveModal(null)} title={modalMode === 'add' ? 'Add Certification' : 'Edit Certification'} footer={<><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleCertSubmit} disabled={modalLoading}>{modalLoading ? 'Saving...' : 'Save'}</button></>}>
        <form onSubmit={handleCertSubmit}>
          <InputField label="Certification Name" name="name" placeholder="AWS Certified Solutions Architect" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} required />
          <InputField label="Issuing Organization" name="issuingOrganization" placeholder="Amazon Web Services" value={certForm.issuingOrganization} onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })} required />
          <div className={styles.twoColumnGrid}>
            <InputField label="Issue Date" name="issueDate" type="date" value={certForm.issueDate} onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })} required />
            <InputField label="Expiration Date (optional)" name="expirationDate" type="date" value={certForm.expirationDate} onChange={(e) => setCertForm({ ...certForm, expirationDate: e.target.value })} />
          </div>
          <InputField label="Credential ID" name="credentialId" placeholder="AWS-12345" value={certForm.credentialId} onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })} />
          <InputField label="Credential URL" name="credentialUrl" placeholder="https://credly.com/badge/example" value={certForm.credentialUrl} onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;