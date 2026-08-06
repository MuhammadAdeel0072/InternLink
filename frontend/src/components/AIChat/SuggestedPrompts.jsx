import React from 'react';

const SuggestedPrompts = ({ onSelect, disabled }) => {
  const prompts = [
    'Explain React Hooks',
    'Review my resume',
    'How to prepare for interviews?',
    'Find internship tips',
    'Teach Node.js',
    'Difference between JWT and Session'
  ];

  return (
    <div className="px-4 py-3 flex flex-wrap gap-2 justify-center">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-full text-text-secondary hover:text-text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
