import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/Modal/Modal';
import Toast from '../../../components/Toast/Toast';
import Loader from '../../../components/Loader/Loader';
import {
  FolderPlus, Trash2, Edit3, Users, MoreVertical,
  ArrowLeft, FolderOpen
} from 'lucide-react';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection
} from '../../../services/talentPoolService';
import styles from './TalentCollections.module.css';

const TalentCollections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [message, setMessage] = useState({ text: '', type: 'error' });

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await getCollections();
      if (res.success) setCollections(res.data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type, isVisible: true });
    setTimeout(() => setToast({ message: '', type: 'success', isVisible: false }), 3000);
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setMessage({ text: '', type: 'error' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'error' });
    try {
      const res = await createCollection(newName.trim(), newDescription.trim());
      if (res.success) {
        setCollections(prev => [...prev, res.data]);
        setShowCreateModal(false);
        resetForm();
        showToast('Collection created');
      } else {
        setMessage({ text: res.message || 'Failed to create collection', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to create collection', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !editingCollection) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'error' });
    try {
      const res = await updateCollection(editingCollection._id, {
        name: newName.trim(),
        description: newDescription.trim()
      });
      if (res.success) {
        setCollections(prev => prev.map(c => c._id === editingCollection._id ? res.data : c));
        setShowEditModal(false);
        setEditingCollection(null);
        resetForm();
        showToast('Collection updated');
      } else {
        setMessage({ text: res.message || 'Failed to update collection', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to update collection', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection? Candidates in this collection will be preserved.')) return;
    try {
      const res = await deleteCollection(id);
      if (res.success) {
        setCollections(prev => prev.filter(c => c._id !== id));
        showToast('Collection deleted');
      }
    } catch (err) {
      showToast('Failed to delete collection', 'error');
    }
    setMenuOpen(null);
  };

  const openEdit = (collection) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description || '');
    setShowEditModal(true);
    setMenuOpen(null);
  };

  const openMenu = (id) => setMenuOpen(menuOpen === id ? null : id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/recruiter/talent-pool')} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={styles.title}>Talent Collections</h1>
          <p className={styles.subtitle}>Organize your candidates into custom folders.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className={styles.createBtn}
        >
          <FolderPlus size={18} /> New Collection
        </button>
      </div>

      {loading ? (
        <Loader fullPage />
      ) : (
        <div className={styles.collectionsGrid}>
          <div
            key="all-candidates"
            className={styles.collectionCard}
            onClick={() => navigate('/recruiter/talent-pool')}
          >
            <div className={styles.collectionIcon} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <FolderOpen size={28} />
            </div>
            <h3 className={styles.collectionName}>All Candidates</h3>
            <p className={styles.collectionDesc}>View your entire talent pool.</p>
          </div>
          {collections.map((collection) => (
            <div key={collection._id} className={styles.collectionCard}>
              <div className={styles.collectionHeader}>
                <div className={styles.collectionIcon} style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                  <FolderOpen size={24} />
                </div>
                <div className={styles.collectionInfo}>
                  <h3 className={styles.collectionName}>{collection.name}</h3>
                  <p className={styles.collectionDesc}>{collection.description || 'No description'}</p>
                </div>
                <div className={styles.menuWrapper}>
                  <button onClick={() => openMenu(collection._id)} className={styles.menuBtn}>
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === collection._id && (
                    <div className={styles.menuDropdown}>
                      <button onClick={() => openEdit(collection)} className={styles.menuItem}>
                        <Edit3 size={14} /> Rename
                      </button>
                      <button onClick={() => handleDelete(collection._id)} className={`${styles.menuItem} ${styles.danger}`}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.collectionFooter}>
                <span className={styles.countBadge}><Users size={14} /> {collection.candidateCount || 0} candidates</span>
              </div>
            </div>
          ))}
          {collections.length === 0 && (
            <div className={styles.emptyState}>
              <FolderPlus size={48} />
              <h3>No collections yet</h3>
              <p>Create collections to organize your candidates.</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create Collection"
      >
        <form onSubmit={handleCreate}>
          {message.text && <div className={message.type === 'error' ? styles.errorMsg : styles.successMsg}>{message.text}</div>}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Collection name" className={styles.formInput} autoFocus />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (optional)</label>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Brief description" rows={2} className={styles.formInput} />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!newName.trim() || actionLoading} className="btn btn-primary">
              {actionLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingCollection(null); resetForm(); }}
        title="Edit Collection"
      >
        <form onSubmit={handleEdit}>
          {message.text && <div className={message.type === 'error' ? styles.errorMsg : styles.successMsg}>{message.text}</div>}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Collection name" className={styles.formInput} autoFocus />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (optional)</label>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Brief description" rows={2} className={styles.formInput} />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={() => { setShowEditModal(false); setEditingCollection(null); resetForm(); }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!newName.trim() || actionLoading} className="btn btn-primary">
              {actionLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
    </div>
  );
};

export default TalentCollections;
