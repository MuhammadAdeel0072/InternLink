import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import StatusBadge from '../../../components/StatusBadge/StatusBadge';
import PrimaryButton from '../../../components/primaryButton/primaryButton';
import Toast from '../../../components/Toast/Toast';
import styles from './Onboarding.module.css';
import {
  Building2,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail as MailIcon,
  Users,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Loader,
  Mail,
  Shield,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'offer-accepted', label: 'Offer Accepted' },
  { value: 'pending-documents', label: 'Pending Documents' },
  { value: 'documents-verified', label: 'Documents Verified' },
  { value: 'joining-scheduled', label: 'Joining Scheduled' },
  { value: 'joined', label: 'Joined' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'completed', label: 'Completed' }
];

const STATUS_COLORS = {
  'offer-accepted': { bg: 'var(--info-light)', color: 'var(--info)' },
  'pending-documents': { bg: 'var(--warning-light)', color: 'var(--warning)' },
  'documents-verified': { bg: 'var(--primary-light)', color: 'var(--primary)' },
  'joining-scheduled': { bg: '#ede9fe', color: '#7c3aed' },
  'joined': { bg: 'var(--success-light)', color: 'var(--success)' },
  'onboarding': { bg: '#fef3c7', color: '#d97706' },
  'completed': { bg: '#d1fae5', color: '#059669' }
};

const Onboarding = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hirings, setHirings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHiring, setSelectedHiring] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOnboarding = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/student/onboarding?${params.toString()}`);
      if (res.data.success) {
        setHirings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load onboarding:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  const handleUploadDocument = async () => {
    if (!selectedHiring || !uploadDocName || !uploadFileUrl) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post(`/hiring/${selectedHiring._id}/documents`, {
        documentName: uploadDocName,
        fileUrl: uploadFileUrl
      });
      if (res.data.success) {
        showToast('Document uploaded successfully', 'success');
        setShowUploadModal(false);
        setUploadDocName('');
        setUploadFileUrl('');
        fetchOnboarding();
        const updated = await api.get(`/student/onboarding/${selectedHiring._id}`);
        if (updated.data.success) {
          setSelectedHiring(updated.data.data);
        }
      }
    } catch (err) {
      showToast('Failed to upload document', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReupload = async (docName) => {
    if (!selectedHiring) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/student/onboarding/${selectedHiring._id}/documents/request`, {
        documentName: docName,
        note: 'Requesting re-upload'
      });
      if (res.data.success) {
        showToast('Re-upload request sent', 'success');
        const updated = await api.get(`/student/onboarding/${selectedHiring._id}`);
        if (updated.data.success) {
          setSelectedHiring(updated.data.data);
        }
      }
    } catch (err) {
      showToast('Failed to request re-upload', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusLabel = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.label : status;
  };

  const getProgress = (checklist) => {
    if (!checklist || checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader size={40} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Onboarding</h1>
          <p className={styles.subtitle}>Track your onboarding progress and manage documents</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {hirings.length === 0 ? (
        <div className={styles.emptyState}>
          <Shield size={48} />
          <h3>No onboarding records</h3>
          <p>Once you accept an offer, your onboarding journey will begin here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {hirings.map((hiring) => (
            <div key={hiring._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <Building2 size={24} />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{hiring.companyId?.companyName || 'Company'}</h3>
                  <span className={styles.cardSub}>{hiring.jobId?.title || 'Position'}</span>
                </div>
                <span className={styles.statusBadge} style={{
                  background: STATUS_COLORS[hiring.status]?.bg || 'var(--bg-tertiary)',
                  color: STATUS_COLORS[hiring.status]?.color || 'var(--text-secondary)'
                }}>
                  {getStatusLabel(hiring.status)}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <Calendar size={16} />
                  <span>Joining Date: {formatDate(hiring.joiningDate)}</span>
                </div>
                <div className={styles.infoRow}>
                  <Clock size={16} />
                  <span>Reporting Time: {hiring.reportingTime || 'N/A'}</span>
                </div>
                <div className={styles.infoRow}>
                  <MapPin size={16} />
                  <span>{hiring.officeLocation || 'N/A'}</span>
                </div>
                <div className={styles.infoRow}>
                  <Users size={16} />
                  <span>Manager: {hiring.managerName || hiring.manager?.name || 'Not assigned'}</span>
                </div>
                <div className={styles.infoRow}>
                  <Briefcase size={16} />
                  <span>Employee ID: {hiring.employeeId || 'Pending'}</span>
                </div>
              </div>

              <div className={styles.checklistPreview}>
                <div className={styles.checklistHeader}>
                  <span>Onboarding Progress</span>
                  <span className={styles.progressText}>{getProgress(hiring.checklist)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${getProgress(hiring.checklist)}%` }}
                  />
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => {
                    const full = api.get(`/student/onboarding/${hiring._id}`);
                    full.then(r => {
                      if (r.data.success) {
                        setSelectedHiring(r.data.data);
                      }
                    }).catch(() => {});
                  }}
                >
                  <FileText size={16} /> View Details
                </button>
                <button className={styles.actionBtn}>
                  <Download size={16} /> Welcome Letter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedHiring && (
        <div className={styles.detailOverlay} onClick={() => setSelectedHiring(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <h2>Onboarding Details</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedHiring(null)}>
                <ChevronDown size={20} />
              </button>
            </div>

            <div className={styles.detailBody}>
              <div className={styles.detailSection}>
                <h3>Company & Job</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Company</label>
                    <span>{selectedHiring.companyId?.companyName || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Job Title</label>
                    <span>{selectedHiring.jobId?.title || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Department</label>
                    <span>{selectedHiring.department || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Joining Date</label>
                    <span>{formatDate(selectedHiring.joiningDate)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>HR Contact</label>
                    <span>{selectedHiring.recruiterId?.email || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Manager</label>
                    <span>{selectedHiring.managerName || selectedHiring.manager?.name || 'Not assigned'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Required Documents</h3>
                <div className={styles.docList}>
                  {selectedHiring.documents?.map((doc, index) => (
                    <div key={index} className={styles.docItem}>
                      <div className={styles.docInfo}>
                        <FileText size={16} />
                        <span className={styles.docName}>{doc.documentName}</span>
                      </div>
                      <span className={styles.docStatus} style={{
                        color: STATUS_COLORS[doc.status]?.color || 'var(--text-secondary)'
                      }}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {doc.status === 'pending' && (
                        <button
                          className={styles.uploadBtn}
                          onClick={() => {
                            setUploadDocName(doc.documentName);
                            setShowUploadModal(true);
                          }}
                        >
                          <Upload size={14} /> Upload
                        </button>
                      )}
                      {doc.status === 'requested' && (
                        <button
                          className={styles.reuploadBtn}
                          onClick={() => handleRequestReupload(doc.documentName)}
                        >
                          <RefreshCw size={14} /> Re-upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Checklist</h3>
                <div className={styles.checklistList}>
                  {selectedHiring.checklist?.map((item, index) => (
                    <div key={index} className={styles.checklistItem}>
                      {item.completed ? (
                        <CheckCircle2 size={18} color="var(--success)" />
                      ) : (
                        <Circle size={18} color="var(--text-muted)" />
                      )}
                      <span className={styles.checklistTask}>{item.task}</span>
                      {item.completedAt && (
                        <span className={styles.checklistDate}>{formatDate(item.completedAt)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Welcome Letter</h3>
                <p className={styles.welcomeLetter}>
                  Welcome to {selectedHiring.companyId?.companyName || 'the company'}!
                  We are excited to have you join our team as a {selectedHiring.jobId?.title || 'team member'}.
                  Your joining date is {formatDate(selectedHiring.joiningDate)}.
                  Please complete all required documents before your start date.
                </p>
                <button className={styles.downloadBtn}>
                  <Download size={16} /> Download Welcome Letter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className={styles.detailOverlay} onClick={() => setShowUploadModal(false)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <h3>Upload Document</h3>
              <button className={styles.closeBtn} onClick={() => setShowUploadModal(false)}>
                <ChevronDown size={20} />
              </button>
            </div>
            <div className={styles.formContainer}>
              <div className={styles.formGroup}>
                <label>Document Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  placeholder="e.g., CNIC / Passport"
                />
              </div>
              <div className={styles.formGroup}>
                <label>File URL</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={uploadFileUrl}
                  onChange={(e) => setUploadFileUrl(e.target.value)}
                  placeholder="Paste file URL or path"
                />
              </div>
              <div className={styles.formActions}>
                <PrimaryButton onClick={handleUploadDocument} disabled={actionLoading}>
                  {actionLoading ? <Loader size={16} /> : <Upload size={16} />} Upload
                </PrimaryButton>
                <button className={styles.cancelBtn} onClick={() => setShowUploadModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'info' })}
        />
      )}
    </div>
  );
};

export default Onboarding;