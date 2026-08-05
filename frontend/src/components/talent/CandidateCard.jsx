import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Briefcase, GraduationCap, Star, Bookmark,
  MessageSquare, Send, Download, Archive, Trash2,
  MoreVertical, Eye, FileText, Link2, CheckCircle2
} from 'lucide-react';
import CandidateRating from './CandidateRating';
import CandidateTags from './CandidateTags';
import CandidateNotes from './CandidateNotes';
import styles from './CandidateCard.module.css';

const AVAILABILITY_COLORS = {
  'open-to-work': { bg: 'var(--success-light)', color: 'var(--success)', label: 'Open to Work' },
  'actively-looking': { bg: 'var(--info-light)', color: 'var(--info)', label: 'Actively Looking' },
  'not-looking': { bg: 'var(--danger-light)', color: 'var(--danger)', label: 'Not Looking' },
  'available-later': { bg: 'var(--warning-light)', color: 'var(--warning)', label: 'Available Later' },
};

const CandidateCard = ({
  candidate,
  profile,
  isFavorite = false,
  rating = 0,
  tags = [],
  collections = [],
  archived = false,
  notes = [],
  activityTimeline = [],
  entryId,
  onViewProfile,
  onToggleFavorite,
  onToggleArchive,
  onRate,
  onAddNote,
  onDeleteNote,
  onAddTag,
  onRemoveTag,
  onInvite,
  onMessage,
  onDownloadResume,
  onRemove,
  onSave,
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const actionsRef = useRef();
  const notesRef = useRef();

  const candidateData = candidate || {};
  profile = profile || {};
  const avatar = candidateData.avatar || '';
  const name = candidateData.name || 'Unknown Candidate';
  const headline = profile.headline || candidateData.headline || '';
  const currentCompany = profile.experience?.[0]?.company || '';
  const currentPosition = profile.experience?.[0]?.title || '';
  const yearsOfExperience = profile.yearsOfExperience || 0;
  const university = profile.university || '';
  const location = profile.locationString || '';
  const availability = profile.currentStatus || 'open-to-work';
  const skills = profile.skills?.map(s => typeof s === 'object' ? s.name : s) || [];
  const resume = profile.resume || '';
  const hasPortfolio = (profile.portfolioLinks?.length > 0) || profile.github || profile.linkedin;
  const completionPercentage = profile.completionPercentage || 0;
  const availabilityInfo = AVAILABILITY_COLORS[availability] || AVAILABILITY_COLORS['open-to-work'];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
      if (notesRef.current && !notesRef.current.contains(e.target)) {
        setShowNotes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewProfile = () => {
    onViewProfile && onViewProfile();
    navigate(`/profile/${candidateData._id}`);
  };

  const handleMessage = async () => {
    setShowActions(false);
    onMessage && onMessage();
  };

  const handleInvite = () => {
    setShowActions(false);
    onInvite && onInvite();
  };

  const handleDownloadResume = () => {
    setShowActions(false);
    if (resume) {
      window.open(resume, '_blank');
      onDownloadResume && onDownloadResume();
    }
  };

  return (
    <div className={`${styles.card} ${archived ? styles.archived : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.candidateInfo}>
          <div className={styles.avatarWrapper}>
            {avatar ? (
              <img src={avatar} alt={name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            {isFavorite && (
              <span className={styles.favoriteBadge} title="Favorite">
                <Star size={12} fill="currentColor" stroke="none" />
              </span>
            )}
          </div>
          <div className={styles.candidateDetails}>
            <h3 className={styles.candidateName}>{name}</h3>
            {headline && <p className={styles.headline}>{headline}</p>}
            {(currentCompany || currentPosition) && (
              <p className={styles.currentRole}>
                {currentPosition}{currentPosition && currentCompany ? ' at ' : ''}{currentCompany}
              </p>
            )}
            <div className={styles.metaRow}>
              {location && (
                <span className={styles.metaItem}>
                  <MapPin size={12} />
                  {location}
                </span>
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

        <div className={styles.headerActions} ref={actionsRef}>
          <div className={styles.ratingWrapper}>
            <CandidateRating rating={rating} onRate={onRate} />
          </div>
          <button
            className={`${styles.favoriteBtn} ${isFavorite ? styles.favorited : ''}`}
            onClick={() => onToggleFavorite && onToggleFavorite()}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" />
          </button>
          <button
            onClick={() => setShowActions(!showActions)}
            className={styles.moreBtn}
            aria-label="More actions"
          >
            <MoreVertical size={18} />
          </button>
          {showActions && (
            <div className={styles.actionsDropdown}>
              <button onClick={handleViewProfile} className={styles.actionItem}>
                <Eye size={15} /> View Profile
              </button>
              <button onClick={handleMessage} className={styles.actionItem}>
                <MessageSquare size={15} /> Message
              </button>
              <button onClick={handleInvite} className={styles.actionItem}>
                <Send size={15} /> Invite to Job
              </button>
              <button onClick={() => { setShowNotes(!showNotes); setShowActions(false); }} className={styles.actionItem}>
                <FileText size={15} /> {showNotes ? 'Hide Notes' : 'Add Notes'}
              </button>
              <button onClick={() => onSave && onSave()} className={styles.actionItem}>
                <Bookmark size={15} /> Save
              </button>
              {resume && (
                <button onClick={handleDownloadResume} className={styles.actionItem}>
                  <Download size={15} /> Download Resume
                </button>
              )}
              <button onClick={() => { onToggleArchive && onToggleArchive(); setShowActions(false); }} className={styles.actionItem}>
                <Archive size={15} /> {archived ? 'Restore' : 'Archive'}
              </button>
              <button onClick={() => { onRemove && onRemove(); setShowActions(false); }} className={`${styles.actionItem} ${styles.danger}`}>
                <Trash2 size={15} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoGrid}>
          {(currentCompany || currentPosition) && (
            <div className={styles.infoItem}>
              <Briefcase size={14} className={styles.infoIcon} />
              <span className={styles.infoText}>
                {currentPosition}{currentPosition && currentCompany ? ' at ' : ''}{currentCompany}
              </span>
            </div>
          )}
          {yearsOfExperience > 0 && (
            <div className={styles.infoItem}>
              <Briefcase size={14} className={styles.infoIcon} />
              <span className={styles.infoText}>{yearsOfExperience} years exp.</span>
            </div>
          )}
          {university && (
            <div className={styles.infoItem}>
              <GraduationCap size={14} className={styles.infoIcon} />
              <span className={styles.infoText}>{university}</span>
            </div>
          )}
          {skills.length > 0 && (
            <div className={styles.infoItem}>
              <CheckCircle2 size={14} className={styles.infoIcon} />
              <span className={styles.infoText}>{skills.length} skills</span>
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className={styles.skillsRow}>
            {skills.slice(0, 5).map((skill, i) => (
              <span key={i} className={styles.skillTag}>{skill}</span>
            ))}
            {skills.length > 5 && (
              <span className={styles.skillMore}>+{skills.length - 5} more</span>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className={styles.tagsRow}>
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className={styles.tagBadge}>{tag}</span>
            ))}
            {tags.length > 4 && (
              <span className={styles.tagMore}>+{tags.length - 4}</span>
            )}
          </div>
        )}

        <div className={styles.footerMeta}>
          <div className={styles.footerLeft}>
            {completionPercentage > 0 && (
              <div className={styles.completionBar}>
                <div className={styles.completionTrack}>
                  <div
                    className={styles.completionFill}
                    style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                  />
                </div>
                <span className={styles.completionText}>{completionPercentage}%</span>
              </div>
            )}
          </div>
          <div className={styles.footerRight}>
            {resume && (
              <span className={styles.badge} title="Resume available">
                <FileText size={12} /> Resume
              </span>
            )}
            {hasPortfolio && (
              <span className={styles.badge} title="Portfolio available">
                <Link2 size={12} /> Portfolio
              </span>
            )}
          </div>
        </div>
      </div>

      {showNotes && (
        <div className={styles.notesPanel} ref={notesRef}>
          <CandidateNotes
            notes={notes}
            onAddNote={onAddNote}
            onDeleteNote={onDeleteNote ? (index) => onDeleteNote(entryId, index) : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default CandidateCard;
