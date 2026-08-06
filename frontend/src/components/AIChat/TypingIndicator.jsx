import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-2 mb-4 px-4"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
        <span className="text-white text-xs font-bold">AI</span>
      </div>
      <div className="bg-bg-secondary border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              animate={['bounce']}
              transition={{ delay: index * 0.15 }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
