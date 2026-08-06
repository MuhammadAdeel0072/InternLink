import React from 'react';

const SuggestedPrompts = ({ onSelect, disabled }) => {
  const prompts = [
    'Explain React Hooks',
    'Review My Resume',
    'Interview Questions',
    'Node.js Guide',
    'JavaScript Roadmap',
    'Database Design',
    'Resume ATS Tips',
    'Career Advice'
  ];

  return (
    <div className="ai-suggested-prompts">
      <p className="ai-suggested-title">Quick prompts to get started</p>
      <div className="ai-suggested-chips">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className="ai-suggested-chip"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
