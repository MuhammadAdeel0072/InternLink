import React from 'react';

const InputField = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  options = [], // Used for select dropdowns
  rows = 3, // Used for textareas
  disabled = false
}) => {
  const inputId = `input-${name}`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          disabled={disabled}
          className={`form-input ${error ? 'input-error' : ''}`}
          style={{ resize: 'vertical' }}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`form-input ${error ? 'input-error' : ''}`}
          style={{ backgroundPosition: 'right 16px center' }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`form-input ${error ? 'input-error' : ''}`}
        />
      )}

      {error && (
        <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
