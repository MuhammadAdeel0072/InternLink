import React, { useState, useMemo } from 'react';
import { Search, X, ZoomIn } from 'lucide-react';
import styles from './SharedImages.module.css';

const SharedImages = ({ messages }) => {
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const images = useMemo(() => {
    return messages
      .filter((msg) => {
        if (!msg.attachments || msg.attachments.length === 0) return false;
        return msg.attachments.some((a) => a.type === 'image');
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [messages]);

  const allImages = useMemo(() => {
    const imgs = [];
    images.forEach((msg) => {
      msg.attachments.forEach((a) => {
        if (a.type === 'image') imgs.push(a);
      });
    });
    return imgs;
  }, [images]);

  return (
    <div className={styles.sharedImages}>
      <div className={styles.sharedImagesHeader}>
        <h3>Shared Images</h3>
        <span className={styles.imageCount}>{allImages.length} images</span>
      </div>

      <div className={styles.searchContainer}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search images..."
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

      <div className={styles.imagesGrid}>
        {allImages.length === 0 ? (
          <p className={styles.noImages}>No images shared yet</p>
        ) : (
          allImages.map((img, idx) => (
            <div key={idx} className={styles.imageItem} onClick={() => setSelectedImage(img.url)}>
              <img src={img.url} alt={img.name} className={styles.imageThumb} />
              <div className={styles.imageOverlay}>
                <ZoomIn size={16} />
              </div>
            </div>
          ))
        )}
      </div>

      {selectedImage && (
        <div className={styles.lightbox} onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="" className={styles.lightboxImage} />
        </div>
      )}
    </div>
  );
};

export default SharedImages;
