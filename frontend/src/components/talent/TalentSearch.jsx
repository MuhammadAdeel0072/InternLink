import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import styles from './TalentSearch.module.css';

const TalentSearch = ({ onSearch, value = '', placeholder = 'Search candidates by name, skills, company, university...' }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (input.length < 2) {
      onSearch('');
      return;
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(input.trim());
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [input, onSearch]);

  const clear = () => {
    setInput('');
    onSearch('');
  };

  return (
    <div className={styles.searchContainer}>
      <Search size={18} className={styles.searchIcon} />
      <input
        type="text"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className={styles.searchInput}
      />
      {input && (
        <button onClick={clear} className={styles.clearBtn} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default TalentSearch;
