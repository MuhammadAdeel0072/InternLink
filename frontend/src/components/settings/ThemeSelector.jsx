import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import ThemeCard from './ThemeCard';
import styles from './ThemeSelector.module.css';

const ThemeSelector = ({ onChange }) => {
  const { currentTheme, changeTheme, availableThemes } = useTheme();

  const handleClick = (themeId) => {
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
          isSelected={currentTheme === t.id}
          onClick={() => handleClick(t.id)}
          description={t.description}
        />
      ))}
    </div>
  );
};

export default ThemeSelector;
