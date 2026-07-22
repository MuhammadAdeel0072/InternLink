import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import styles from './SkillSuggestions.module.css';

const SkillSuggestions = ({ onSelect, existingSkills = [] }) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`/profile/skills/suggestions?search=${search}`);
        const filtered = (res.data || []).filter(
          s => !existingSkills.some(existing => existing.name?.toLowerCase() === s.toLowerCase() || existing === s)
        );
        setSuggestions(filtered);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };

    if (search.length >= 1) {
      fetchSuggestions();
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search, existingSkills]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={styles.skillSuggestionsWrapper}>
      <input
        type="text"
        placeholder="Search or add a skill..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && search.trim()) {
            e.preventDefault();
            onSelect({ name: search.trim(), proficiency: 'intermediate' });
            setSearch('');
            setShowSuggestions(false);
          }
        }}
        className={`form-input ${styles.skillInput}`}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestionsDropdown}>
          {suggestions.map((skill, index) => (
            <div
              key={index}
              onClick={() => {
                onSelect({ name: skill, proficiency: 'intermediate' });
                setSearch('');
                setShowSuggestions(false);
              }}
              className={styles.suggestionItem}
            >
              {skill}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillSuggestions;