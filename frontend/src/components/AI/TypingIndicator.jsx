import React from 'react';
import { motion } from 'framer-motion';

const dotVariants = {
  start: { y: 0 },
  bounce: {
    y: [-6, 0, -6],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="ai-typing-indicator"
    >
      <div className="ai-typing-avatar">
        <span className="ai-typing-avatar-text">AI</span>
      </div>
      <div className="ai-typing-bubble">
        <div className="ai-typing-dots">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              animate="bounce"
              transition={{ delay: index * 0.15 }}
              className="ai-typing-dot"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
