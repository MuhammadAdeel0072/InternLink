import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

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
  }, [search]);

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
    <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '12px' }}>
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
        className="form-input"
        style={{ width: '100%' }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 10,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {suggestions.map((skill, index) => (
            <div
              key={index}
              onClick={() => {
                onSelect({ name: skill, proficiency: 'intermediate' });
                setSearch('');
                setShowSuggestions(false);
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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