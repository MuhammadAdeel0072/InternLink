import React from 'react';
import { motion } from 'framer-motion';
import { X, Bot } from 'lucide-react';

const AIHeader = ({ onClose }) => {
  return (
    <div className="ai-drawer-header">
      <div className="ai-drawer-header-left">
        <div className="ai-header-avatar">
          <Bot size={20} className="text-white" strokeWidth={1.5} />
          <span className="ai-header-online-indicator" />
        </div>
        <div className="ai-header-info">
          <h2 className="ai-header-title">InternLink AI</h2>
          <p className="ai-header-subtitle">Career & Learning Assistant</p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="ai-header-close-btn"
        aria-label="Close AI Assistant"
      >
        <X size={18} />
      </motion.button>
    </div>
  );
};

export default AIHeader;
