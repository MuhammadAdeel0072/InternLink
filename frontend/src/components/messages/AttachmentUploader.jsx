import React, { useRef, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import styles from './AttachmentUploader.module.css';

const AttachmentUploader = ({ attachment, preview, onRemove, onFileChange }) => {
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileChange(file);
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className={styles.attachmentUploader}>
      {attachment && (
        <div className={styles.attachmentPreview}>
          {preview ? (
            <img src={preview} alt="" className={styles.previewImage} />
          ) : (
            <div className={styles.previewIcon}>
              <FileText size={24} />
            </div>
          )}
          <div className={styles.previewInfo}>
            <span className={styles.previewName}>{attachment.name}</span>
            <span className={styles.previewSize}>
              {(attachment.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <button type="button" onClick={onRemove} className={styles.removeButton}>
            <X size={16} />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept="image/*,.pdf,.doc,.docx,.zip"
        className={styles.hiddenInput}
      />
    </div>
  );
};

export default AttachmentUploader;
