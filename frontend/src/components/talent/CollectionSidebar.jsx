import React, { useState, useEffect } from 'react';
import { FolderPlus, MoreVertical, Trash2, Edit3, FolderOpen } from 'lucide-react';
import { createCollection, deleteCollection, updateCollection } from '../../services/talentPoolService';
import Modal from '../Modal/Modal';
import styles from './CollectionSidebar.module.css';

const CollectionSidebar = ({
  collections = [],
  selectedCollectionId,
  onSelectCollection,
  onRefresh,
  onCollectionUpdate,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'error' });

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setMessage({ text: '', type: 'error' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setMessage({ text: '', type: 'error' });
    try {
      const res = await createCollection(newName.trim(), newDescription.trim());
      if (res.success) {
        setShowCreateModal(false);
        resetForm();
        onRefresh && onRefresh();
        onCollectionUpdate && onCollectionUpdate();
      } else {
        setMessage({ text: res.message || 'Failed to create collection', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to create collection', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !editingCollection) return;
    setLoading(true);
    setMessage({ text: '', type: 'error' });
    try {
      const res = await updateCollection(editingCollection._id, {
        name: newName.trim(),
        description: newDescription.trim()
      });
      if (res.success) {
        setShowEditModal(false);
        setEditingCollection(null);
        resetForm();
        onRefresh && onRefresh();
        onCollectionUpdate && onCollectionUpdate();
      } else {
        setMessage({ text: res.message || 'Failed to update collection', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to update collection', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteCollection(id);
      if (res.success) {
        setShowMenu(null);
        onRefresh && onRefresh();
        onCollectionUpdate && onCollectionUpdate();
        if (selectedCollectionId === id) {
          onSelectCollection && onSelectCollection(null);
        }
      }
    } catch (err) {
      console.error('Delete collection error:', err);
    }
  };

  const openEdit = (collection) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description || '');
    setShowEditModal(true);
    setShowMenu(null);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>Collections</h3>
        <button
          type="button"
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className={styles.createBtn}
          aria-label="Create collection"
        >
          <FolderPlus size={18} />
        </button>
      </div>

      <nav className={styles.collectionNav}>
        <button
          type="button"
          className={`${styles.collectionItem} ${!selectedCollectionId ? styles.active : ''}`}
          onClick={() => onSelectCollection && onSelectCollection(null)}
        >
          <FolderOpen size={16} />
          <span>All Candidates</span>
        </button>
        {collections.map((collection) => (
          <div
            key={collection._id}
            className={`${styles.collectionItemWrapper} ${selectedCollectionId === collection._id ? styles.active : ''}`}
          >
            <button
              type="button"
              className={styles.collectionItem}
              onClick={() => onSelectCollection && onSelectCollection(collection._id)}
            >
              <FolderOpen size={16} />
              <span className={styles.collectionName}>{collection.name}</span>
            </button>
            <div className={styles.menuWrapper}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === collection._id ? null : collection._id); }}
                className={styles.menuBtn}
              >
                <MoreVertical size={14} />
              </button>
              {showMenu === collection._id && (
                <div className={styles.menuDropdown}>
                  <button
                    type="button"
                    onClick={() => openEdit(collection)}
                    className={styles.menuItem}
                  >
                    <Edit3 size={14} />
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(collection._id)}
                    className={`${styles.menuItem} ${styles.danger}`}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </nav>

      {collections.length === 0 && (
        <p className={styles.emptyText}>No collections yet. Create one to organize candidates.</p>
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
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className={styles.formInput}
              autoFocus
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (optional)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className={styles.formInput}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!newName.trim() || loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create'}
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
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className={styles.formInput}
              autoFocus
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description (optional)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className={styles.formInput}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={() => { setShowEditModal(false); setEditingCollection(null); resetForm(); }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!newName.trim() || loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </aside>
  );
};

export default CollectionSidebar;
