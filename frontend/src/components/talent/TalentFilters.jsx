import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import styles from './TalentFilters.module.css';

const LOCATION_OPTIONS = [
  { value: '', label: 'All Locations' },
  { value: 'remote', label: 'Remote' },
  { value: 'usa', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'india', label: 'India' },
  { value: 'canada', label: 'Canada' },
  { value: 'germany', label: 'Germany' },
  { value: 'australia', label: 'Australia' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'uae', label: 'UAE' },
];

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'All Experience' },
  { value: '0', label: 'Internship / Fresher' },
  { value: '1', label: '1+ years' },
  { value: '2', label: '2+ years' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
  { value: '10', label: '10+ years' },
];

const EDUCATION_OPTIONS = [
  { value: '', label: 'All Education' },
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certification', label: 'Certification' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All Availability' },
  { value: 'open-to-work', label: 'Open to Work' },
  { value: 'actively-looking', label: 'Actively Looking' },
  { value: 'not-looking', label: 'Not Looking' },
  { value: 'available-later', label: 'Available Later' },
];

const WORK_TYPE_OPTIONS = [
  { value: '', label: 'All Work Types' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Freelance', label: 'Freelance' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'recently-updated', label: 'Recently Updated' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name (A-Z)' },
];

const TalentFilters = ({
  filters,
  onFilterChange,
  onReset,
  onBulkActions,
  showBulkActions = false,
  selectedCount = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.mainFilters}>
        <div className={styles.filterGroup}>
          <Filter size={18} className={styles.filterIcon} />
          <span className={styles.filterLabel}>Filters</span>
        </div>

        <select
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          className={styles.select}
        >
          <option value="">All Candidates</option>
          <option value="false">Active</option>
          <option value="true">Archived</option>
          <option value="isFavorite">Favorites</option>
        </select>

        <select
          value={filters.rating || ''}
          onChange={(e) => handleChange('rating', e.target.value)}
          className={styles.select}
        >
          <option value="">All Ratings</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="2">2+ Stars</option>
          <option value="1">1+ Stars</option>
        </select>

        <select
          value={filters.availability || ''}
          onChange={(e) => handleChange('availability', e.target.value)}
          className={styles.select}
        >
          <option value="">All Availability</option>
          {AVAILABILITY_OPTIONS.slice(1).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          className={styles.select}
        >
          {LOCATION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters.experience || ''}
          onChange={(e) => handleChange('experience', e.target.value)}
          className={styles.select}
        >
          {EXPERIENCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <button
          type="button"
          className={`${styles.advancedBtn} ${showAdvanced ? styles.active : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Advanced
          {showAdvanced ? <X size={14} /> : <Filter size={14} />}
        </button>

        {(filters.search || filters.location || filters.rating || filters.availability || filters.status || filters.experience) && (
          <button type="button" onClick={onReset} className={styles.resetBtn}>
            Reset
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className={styles.advancedPanel}>
          <div className={styles.advancedRow}>
            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>Education</label>
              <select
                value={filters.education || ''}
                onChange={(e) => handleChange('education', e.target.value)}
                className={styles.select}
              >
                {EDUCATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>Work Type</label>
              <select
                value={filters.workType || ''}
                onChange={(e) => handleChange('workType', e.target.value)}
                className={styles.select}
              >
                {WORK_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>Sort By</label>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => handleChange('sort', e.target.value)}
                className={styles.select}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>Tags</label>
              <input
                type="text"
                placeholder="Filter by tags..."
                value={filters.tags || ''}
                onChange={(e) => handleChange('tags', e.target.value)}
                className={styles.textInput}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentFilters;
