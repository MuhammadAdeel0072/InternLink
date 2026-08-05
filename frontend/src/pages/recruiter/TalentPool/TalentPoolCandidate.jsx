import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/Modal/Modal';
import CandidateRating from '../../../components/talent/CandidateRating';
import CandidateTags from '../../../components/talent/CandidateTags';
import CandidateNotes from '../../../components/talent/CandidateNotes';
import InviteCandidateModal from '../../../components/talent/InviteCandidateModal';
import Toast from '../../../components/Toast/Toast';
import Loader from '../../../components/Loader/Loader';
import {
  ArrowLeft, Star, Bookmark, MessageSquare, Send, Download,
  Archive, Trash2, ExternalLink, Briefcase, GraduationCap,
  Award, FolderOpen, Link2, Mail, Phone, Globe, MapPin,
  Clock, CheckCircle2, XCircle
} from 'lucide-react';
import {
  getTalentPoolEntry,
  toggleFavorite,
  toggleArchive,
  rateCandidate,
  addNote,
  deleteNote,
  addTag,
  inviteCandidate,
  startConversation,
  removeFromTalentPool
} from '../../../services/talentPoolService';
import styles from './TalentPoolCandidate.module.css';

const AVAILABILITY_MAP = {
  'open-to-work': { label: 'Open to Work', color: 'var(--success)', bg: 'var(--success-light)' },
  'actively-looking': { label: 'Actively Looking', color: 'var(--info)', bg: 'var(--info-light)' },
  'not-looking': { label: 'Not Looking', color: 'var(--danger)', bg: 'var(--danger-light)' },
  'available-later': { label: 'Available Later', color: 'var(--warning)', bg: 'var(--warning-light)' },
};

const TalentPoolCandidate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const res = await getTalentPoolEntry(id);
      if (res.success) {
        setEntry(res.data);
        setProfile(res.data.profile);
      } else {
        navigate('/recruiter/talent-pool');
      }
    } catch (err) {
      console.error('Failed to load candidate:', err);
      navigate('/recruiter/talent-pool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEntry();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast({ message: '', type: 'success', isVisible: false }), 3000);
  };

  const handleToggleFavorite = async () => {
    try {
      const res = await toggleFavorite(entry._id);
      if (res.success) {
        setEntry(prev => ({ ...prev, isFavorite: res.data.isFavorite }));
        showToast(res.message);
      }
    } catch (err) {
      showToast('Failed to update favorite', 'error');
    }
  };

  const handleToggleArchive = async () => {
    try {
      const res = await toggleArchive(entry._id);
      if (res.success) {
        setEntry(prev => ({ ...prev, archived: res.data.archived }));
        showToast(res.message);
        setTimeout(() => navigate('/recruiter/talent-pool'), 800);
      }
    } catch (err) {
      showToast('Failed to update archive status', 'error');
    }
  };

  const handleRate = async (rating) => {
    try {
      const res = await rateCandidate(entry._id, rating);
      if (res.success) {
        setEntry(prev => ({ ...prev, rating: res.data.rating }));
        showToast(res.message);
      }
    } catch (err) {
      showToast('Failed to rate candidate', 'error');
    }
  };

  const handleAddNote = async (text) => {
    try {
      setSaving(true);
      const res = await addNote(entry._id, text);
      if (res.success) {
        setEntry(prev => ({ ...prev, notes: res.data.notes }));
        showToast('Note added');
      }
    } catch (err) {
      showToast('Failed to add note', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (index) => {
    try {
      const res = await deleteNote(entry._id, index);
      if (res.success) {
        setEntry(prev => ({ ...prev, notes: res.data.notes }));
        showToast('Note deleted');
      }
    } catch (err) {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleAddTag = async (tags) => {
    try {
      const res = await addTag(entry._id, tags);
      if (res.success) {
        setEntry(prev => ({ ...prev, tags: res.data.tags }));
        showToast('Tags added');
      }
    } catch (err) {
      showToast('Failed to add tags', 'error');
    }
  };

  const handleRemoveTag = async (tag) => {
    const newTags = entry.tags.filter(t => t !== tag);
    try {
      const res = await addTag(entry._id, newTags);
      if (res.success) {
        setEntry(prev => ({ ...prev, tags: res.data.tags }));
        showToast('Tag removed');
      }
    } catch (err) {
      showToast('Failed to remove tag', 'error');
    }
  };

  const handleMessage = async () => {
    try {
      const res = await startConversation(entry.candidate._id);
      if (res.success) {
        navigate(`/messages/${res.data._id}`);
      } else {
        navigate('/messages');
      }
    } catch (err) {
      navigate('/messages');
    }
  };

  const handleInvite = () => setShowInviteModal(true);

  const handleRemove = async () => {
    if (!window.confirm('Remove this candidate from your talent pool?')) return;
    try {
      await removeFromTalentPool(entry._id);
      navigate('/recruiter/talent-pool');
      showToast('Candidate removed');
    } catch (err) {
      showToast('Failed to remove candidate', 'error');
    }
  };

  const handleDownloadResume = () => {
    if (profile?.resume) {
      window.open(profile.resume, '_blank');
    }
  };

  if (loading) return <Loader fullPage />;
  if (!entry || !profile) return <div>Candidate not found</div>;

  const candidate = entry.candidate;
  const availability = entry.status || 'open-to-work';
  const availabilityInfo = AVAILABILITY_MAP[availability] || AVAILABILITY_MAP['open-to-work'];
  const skills = profile.skills?.map(s => typeof s === 'object' ? s.name : s) || [];
  const languages = profile.languages?.map(l => l.name) || [];
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills & Projects' },
    { id: 'notes', label: 'Notes & Rating' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/recruiter/talent-pool')} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.candidateHeader}>
          <div className={styles.avatarSection}>
            {candidate.avatar ? (
              <img src={candidate.avatar} alt={candidate.name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{candidate.name?.charAt(0).toUpperCase()}</div>
            )}
            {entry.isFavorite && (
              <span className={styles.favoriteBadge}><Star size={14} fill="currentColor" stroke="none" /></span>
            )}
          </div>
          <div className={styles.candidateHeaderInfo}>
            <h1 className={styles.candidateName}>{candidate.name}</h1>
            {profile.headline && <p className={styles.headline}>{profile.headline}</p>}
            <div className={styles.metaRow}>
              {profile.locationString && (
                <span className={styles.metaItem}><MapPin size={14} /> {profile.locationString}</span>
              )}
              <span
                className={styles.availabilityBadge}
                style={{ background: availabilityInfo.bg, color: availabilityInfo.color }}
              >
                {availabilityInfo.label}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleMessage} className={`${styles.actionBtn} ${styles.messageBtn}`}>
            <MessageSquare size={18} /> Message
          </button>
          <button onClick={handleInvite} className={`${styles.actionBtn} ${styles.inviteBtn}`}>
            <Send size={18} /> Invite
          </button>
          <button onClick={handleToggleFavorite} className={`${styles.iconBtn} ${entry.isFavorite ? styles.favorited : ''}`}>
            <Star size={20} fill={entry.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" />
          </button>
          {profile.resume && (
            <button onClick={handleDownloadResume} className={styles.iconBtn} title="Download Resume">
              <Download size={20} />
            </button>
          )}
          <button onClick={handleToggleArchive} className={`${styles.iconBtn}`} title={entry.archived ? 'Restore' : 'Archive'}>
            <Archive size={20} />
          </button>
          <button onClick={handleRemove} className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Remove">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>About</h3>
              <p className={styles.summary}>{profile.summary || 'No summary provided.'}</p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Contact</h3>
              <div className={styles.contactGrid}>
                {profile.email && (
                  <div className={styles.contactItem}><Mail size={16} /> {profile.email}</div>
                )}
                {profile.phone && (
                  <div className={styles.contactItem}><Phone size={16} /> {profile.phone}</div>
                )}
                {profile.website && (
                  <div className={styles.contactItem}><Globe size={16} /> {profile.website}</div>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                    <Link2 size={16} /> GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                    <ExternalLink size={16} /> LinkedIn
                  </a>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Profile Completion</h3>
              <div className={styles.completion}>
                <div className={styles.completionTrack}>
                  <div className={styles.completionFill} style={{ width: `${Math.min(profile.completionPercentage, 100)}%` }} />
                </div>
                <span className={styles.completionText}>{profile.completionPercentage}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className={styles.experienceTab}>
            {profile.experience?.length > 0 ? (
              profile.experience.map((exp, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>{exp.title}</h4>
                    <p className={styles.timelineSubtitle}>{exp.company}</p>
                    <p className={styles.timelineDate}>
                      {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                      {exp.current ? ' Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                    </p>
                    {exp.description && <p className={styles.timelineDesc}>{exp.description}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyText}>No experience listed.</p>
            )}
          </div>
        )}

        {activeTab === 'education' && (
          <div className={styles.educationTab}>
            {profile.education?.length > 0 ? (
              profile.education.map((edu, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</h4>
                    <p className={styles.timelineSubtitle}>{edu.school}</p>
                    <p className={styles.timelineDate}>
                      {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                      {edu.current ? ' Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                    </p>
                    {edu.grade && <p className={styles.timelineDesc}>Grade: {edu.grade}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyText}>No education listed.</p>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className={styles.skillsTab}>
            {skills.length > 0 && (
              <div className={styles.skillGroup}>
                <h4 className={styles.skillGroupTitle}>Skills</h4>
                <div className={styles.skillList}>
                  {skills.map((skill, i) => (
                    <span key={i} className={styles.skillTag}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {languages.length > 0 && (
              <div className={styles.skillGroup}>
                <h4 className={styles.skillGroupTitle}>Languages</h4>
                <div className={styles.skillList}>
                  {languages.map((lang, i) => (
                    <span key={i} className={styles.languageTag}>{lang}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.certifications?.length > 0 && (
              <div className={styles.skillGroup}>
                <h4 className={styles.skillGroupTitle}>Certifications</h4>
                {profile.certifications.map((cert, i) => (
                  <div key={i} className={styles.certItem}>
                    <Award size={16} />
                    <div>
                      <p className={styles.certName}>{cert.name}</p>
                      <p className={styles.certOrg}>{cert.issuingOrganization}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {profile.projects?.length > 0 && (
              <div className={styles.skillGroup}>
                <h4 className={styles.skillGroupTitle}>Projects</h4>
                {profile.projects.map((proj, i) => (
                  <div key={i} className={styles.projectItem}>
                    <h5 className={styles.projectTitle}>{proj.title}</h5>
                    <p className={styles.projectDesc}>{proj.description}</p>
                    {proj.technologies?.length > 0 && (
                      <div className={styles.projectTechs}>
                        {proj.technologies.map((t, j) => (
                          <span key={j} className={styles.techTag}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className={styles.notesTab}>
            <div className={styles.notesSection}>
              <h3 className={styles.sectionTitle}>Recruiter Notes</h3>
              <CandidateNotes
                notes={entry.notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                readonly={saving}
              />
            </div>
            <div className={styles.notesSection}>
              <h3 className={styles.sectionTitle}>Rating</h3>
              <CandidateRating rating={entry.rating} onRate={handleRate} />
            </div>
            <div className={styles.notesSection}>
              <h3 className={styles.sectionTitle}>Tags</h3>
              <CandidateTags
                tags={entry.tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </div>
            {entry.activityTimeline?.length > 0 && (
              <div className={styles.notesSection}>
                <h3 className={styles.sectionTitle}>Activity Timeline</h3>
                <div className={styles.timeline}>
                  {entry.activityTimeline.slice(0, 20).map((event, i) => (
                    <div key={i} className={styles.timelineEvent}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineContent}>
                        <p className={styles.timelineAction}>{event.details || event.action}</p>
                        <p className={styles.timelineDate}>{new Date(event.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteCandidateModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          candidate={candidate}
        />
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
    </div>
  );
};

export default TalentPoolCandidate;
