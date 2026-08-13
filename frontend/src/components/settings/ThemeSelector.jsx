import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import ThemeCard from './ThemeCard';
import styles from './ThemeSelector.module.css';

const ThemeSelector = ({ onChange, disabled, value: controlledValue }) => {
  const { currentTheme, changeTheme, availableThemes } = useTheme();
  const selectedTheme = controlledValue || currentTheme;

  const handleClick = (themeId) => {
    if (disabled) return;
    changeTheme(themeId);
    if (onChange) {
      onChange(themeId);
    }
  };

  return (
    <div className={styles.themeSelector}>
      {availableThemes.map((t) => (
        <ThemeCard
          key={t.id}
          theme={t.id}
          isSelected={selectedTheme === t.id}
          onClick={() => handleClick(t.id)}
          description={t.description}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default ThemeSelector;
