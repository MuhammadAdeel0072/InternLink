import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './CandidateRating.module.css';

const CandidateRating = ({ rating = 0, onRate, readonly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className={styles.rating} role="radiogroup" aria-label="Candidate rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hover || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${styles.starBtn} ${isFilled ? styles.filled : ''}`}
            onClick={() => !readonly && onRate && onRate(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            tabIndex={readonly ? -1 : 0}
          >
            <Star
              size={18}
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={isFilled ? 0 : 2}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className={styles.ratingText}>{rating}/5</span>
      )}
    </div>
  );
};

export default CandidateRating;
