import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import styles from './CandidateTags.module.css';

const SUGGESTED_TAGS = [
  'React', 'Node.js', 'Python', 'Java', 'AI', 'Remote',
  'Senior', 'Fresh Graduate', 'Interviewed', 'Future Hire',
  'Top Candidate', 'Frontend', 'Backend', 'Full Stack',
  'Mobile', 'DevOps', 'Cloud', 'Data Science', 'ML'
];

const CandidateTags = ({ tags = [], onAddTag, onRemoveTag, readonly = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef();
  const containerRef = useRef();

  const suggestions = SUGGESTED_TAGS.filter(
    tag => tag.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(tag)
  );

  const handleAdd = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag && onAddTag(trimmed);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAdd(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemoveTag && onRemoveTag(tags[tags.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.tagContainer} ref={containerRef}>
      <div className={styles.tagList}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            {!readonly && (
              <button
                type="button"
                onClick={() => onRemoveTag && onRemoveTag(tag)}
                className={styles.removeBtn}
                aria-label={`Remove ${tag}`}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
      </div>

      {!readonly && (
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag..."
            className={styles.tagInput}
          />
          {inputValue && (
            <button type="button" onClick={() => handleAdd(inputValue)} className={styles.addBtn}>
              <Plus size={14} />
            </button>
          )}
        </div>
      )}

      {!readonly && showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.slice(0, 8).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAdd(tag)}
              className={styles.suggestionItem}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateTags;
