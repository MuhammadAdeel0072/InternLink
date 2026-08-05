import React, { useState, useMemo } from 'react';
import { FileText, Download, Search, X } from 'lucide-react';
import styles from './SharedFiles.module.css';

const SharedFiles = ({ messages }) => {
  const [search, setSearch] = useState('');

  const files = useMemo(() => {
    return messages
      .filter((msg) => {
        if (!msg.attachments || msg.attachments.length === 0) return false;
        if (search) {
          const q = search.toLowerCase();
          return msg.attachments.some((a) => a.name.toLowerCase().includes(q));
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [messages, search]);

  return (
    <div className={styles.sharedFiles}>
      <div className={styles.sharedFilesHeader}>
        <h3>Shared Files</h3>
        <span className={styles.fileCount}>{files.length} files</span>
      </div>

      <div className={styles.searchContainer}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        {search && (
          <button onClick={() => setSearch('')} className={styles.searchClear}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.filesList}>
        {files.length === 0 ? (
          <p className={styles.noFiles}>No files shared yet</p>
        ) : (
          files.map((msg) =>
            msg.attachments.map((attachment, idx) => (
              <a
                key={`${msg._id}-${idx}`}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fileItem}
              >
                <div className={styles.fileIcon}>
                  <FileText size={20} />
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{attachment.name}</span>
                  <span className={styles.fileMeta}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Download size={16} className={styles.downloadIcon} />
              </a>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default SharedFiles;
