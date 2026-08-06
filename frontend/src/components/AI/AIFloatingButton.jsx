import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0 0 rgba(99, 102, 241, 0.4)',
      '0 0 0 16px rgba(99, 102, 241, 0)',
      '0 0 0 0 rgba(99, 102, 241, 0)'
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut'
    }
  }
};

const AIFloatingButton = () => {
  const { openDrawer, isDrawerOpen } = useAI();

  if (isDrawerOpen) return null;

  return (
    <motion.button
      onClick={openDrawer}
      className="ai-floating-button"
      variants={pulseVariants}
      animate="pulse"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Open InternLink AI Assistant"
      title="InternLink AI"
    >
      <Bot size={28} className="text-white" strokeWidth={1.5} />
    </motion.button>
  );
};

export default AIFloatingButton;
