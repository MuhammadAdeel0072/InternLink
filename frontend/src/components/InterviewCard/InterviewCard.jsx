import React from 'react';
import StatusBadge from '../StatusBadge/StatusBadge';
import styles from './InterviewCard.module.css';
import {
  Calendar, Clock, Video, MapPin, Phone,
  Eye, Play, RefreshCw, XCircle, Download,
  MessageSquare, FileText
} from 'lucide-react';

const getTypeIcon = (type) => {
  switch (type) {
    case 'online': return Video;
    case 'on-site': return MapPin;
    case 'phone': return Phone;
    default: return Calendar;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'online': return 'Online';
    case 'on-site': return 'On-site';
    case 'phone': return 'Phone';
    default: return type;
  }
};

const InterviewCard = ({ interview, onViewDetails, onStart, onReschedule, onCancel, userRole }) => {
  const Icon = getTypeIcon(interview.interviewType);
  const interviewDate = interview.date ? new Date(interview.date) : null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getTimeRemaining = (date, time) => {
    if (!date) return '';
    const [hours, minutes] = (time || '00:00').split(':').map(Number);
    const interviewDateTime = new Date(date);
    interviewDateTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const diffMs = interviewDateTime - now;
    if (diffMs <= 0) return 'Past';
    if (diffMs < 60 * 60 * 1000) {
      const mins = Math.floor(diffMs / (60 * 1000));
      return `${mins}m left`;
    }
    if (diffMs < 24 * 60 * 60 * 1000) {
      const hrs = Math.floor(diffMs / (60 * 60 * 1000));
      return `${hrs}h left`;
    }
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${days}d left`;
  };

  const getCandidateName = () => {
    if (userRole === 'recruiter') {
      return interview.candidateData?.name || interview.candidateId?.name || 'Candidate';
    }
    return interview.recruiterData?.name || interview.recruiterId?.name || 'Recruiter';
  };

  const getCandidateAvatar = () => {
    if (userRole === 'recruiter') {
      return interview.candidateData?.avatar || null;
    }
    return null;
  };

  const getInitial = () => {
    const name = getCandidateName();
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const isUpcoming = interviewDate &&
    interviewDate >= new Date(interviewDate.getFullYear(), interviewDate.getMonth(), interviewDate.getDate() - 1);

  const showStartButton =
    userRole === 'recruiter' &&
    interview.interviewType === 'online' &&
    interview.meetingLink &&
    ['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'].includes(interview.status);

  const timeRemaining = getTimeRemaining(interview.date, interview.time);

  return (
    <div className={styles.interviewCard}>
      <div className={styles.cardHeader}>
        <div className={styles.candidateInfo}>
          {getCandidateAvatar() ? (
            <img src={getCandidateAvatar()} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>{getInitial()}</div>
          )}
          <div className={styles.candidateDetails}>
            <h3 className={styles.candidateName}>{getCandidateName()}</h3>
            <p className={styles.jobTitle}>{interview.jobData?.title || interview.jobId?.title || 'Job Title'}</p>
            {userRole === 'recruiter' && interview.candidateData?.headline && (
              <p className={styles.headline}>{interview.candidateData.headline}</p>
            )}
          </div>
        </div>
        <div className={styles.statusContainer}>
          <StatusBadge status={interview.status} size="sm" />
          {timeRemaining && <span className={styles.timeRemaining}>{timeRemaining}</span>}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Calendar size={16} className={styles.infoIcon} />
            <span className={styles.infoValue}>{formatDate(interview.date)}</span>
          </div>
          <div className={styles.infoItem}>
            <Clock size={16} className={styles.infoIcon} />
            <span className={styles.infoValue}>{interview.time || 'N/A'}</span>
          </div>
          <div className={styles.infoItem}>
            <Icon size={16} className={styles.infoIcon} />
            <span className={styles.infoValue}>{getTypeLabel(interview.interviewType)}</span>
          </div>
          {interview.duration && (
            <div className={styles.infoItem}>
              <Clock size={16} className={styles.infoIcon} />
              <span className={styles.infoValue}>{interview.duration}</span>
            </div>
          )}
          {interview.interviewType === 'on-site' && interview.location && (
            <div className={styles.infoItem}>
              <MapPin size={16} className={styles.infoIcon} />
              <span className={styles.infoValue}>{interview.location}</span>
            </div>
          )}
          {interview.interviewType === 'online' && interview.meetingLink && (
            <div className={styles.infoItem}>
              <Video size={16} className={styles.infoIcon} />
              <span className={styles.infoValue}>{interview.meetingPlatform || 'Video Call'}</span>
            </div>
          )}
        </div>

        {interview.notes && (
          <div className={styles.notesPreview}>
            <FileText size={14} className={styles.notesIcon} />
            <p className={styles.notesText}>{interview.notes}</p>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.footerLeft}>
          {interview.companyData?.companyName && (
            <span className={styles.companyName}>{interview.companyData.companyName}</span>
          )}
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.viewBtn}`}
            onClick={() => onViewDetails(interview)}
            title="View Details"
          >
            <Eye size={16} />
          </button>

          {showStartButton && (
            <button
              className={`${styles.actionBtn} ${styles.startBtn}`}
              onClick={() => onStart(interview)}
              title="Start Interview"
            >
              <Play size={16} />
            </button>
          )}

          {userRole === 'recruiter' &&
            ['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'].includes(interview.status) && (
              <button
                className={`${styles.actionBtn} ${styles.rescheduleBtn}`}
                onClick={() => onReschedule(interview)}
                title="Reschedule"
              >
                <RefreshCw size={16} />
              </button>
            )}

          {userRole === 'recruiter' &&
            ['scheduled', 'pending-confirmation', 'confirmed', 'rescheduled'].includes(interview.status) && (
              <button
                className={`${styles.actionBtn} ${styles.cancelBtn}`}
                onClick={() => onCancel(interview)}
                title="Cancel"
              >
                <XCircle size={16} />
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
