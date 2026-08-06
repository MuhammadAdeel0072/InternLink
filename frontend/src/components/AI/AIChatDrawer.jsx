import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAI } from '../../contexts/AIContext';
import AIHeader from './AIHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const AIChatDrawer = () => {
  const {
    isDrawerOpen,
    closeDrawer,
    messages,
    loading,
    error,
    input,
    setInput,
    sendMessage,
    showWelcome,
    regenerateLastMessage,
    messagesEndRef,
    inputRef
  } = useAI();

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="ai-drawer-backdrop"
            onClick={closeDrawer}
          />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            className="ai-drawer"
          >
            <AIHeader onClose={closeDrawer} />
            <ChatMessages
              messages={messages}
              loading={loading}
              showWelcome={showWelcome}
              onRegenerate={regenerateLastMessage}
              sendMessage={sendMessage}
              messagesEndRef={messagesEndRef}
            />
            {error && (
              <div className="ai-drawer-error-bar">
                {error}
              </div>
            )}
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              loading={loading}
              disabled={false}
              inputRef={inputRef}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIChatDrawer;
