import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SuggestedPrompts from './SuggestedPrompts';

const ChatMessages = ({ messages, loading, showWelcome, onRegenerate, sendMessage, messagesEndRef }) => {
  const handlePromptSelect = (prompt) => {
    if (sendMessage) {
      sendMessage(prompt);
    }
  };

  return (
    <div className="ai-chat-messages">
      <AnimatePresence>
        {showWelcome && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="ai-welcome-screen"
          >
            <div className="ai-welcome-icon">
              <span className="text-4xl">👋</span>
            </div>
            <h3 className="ai-welcome-title">Hello!</h3>
            <p className="ai-welcome-subtitle">I'm InternLink AI. I'm here to help you with:</p>
            <ul className="ai-welcome-list">
              {[
                'Programming',
                'Resume Review',
                'Interview Preparation',
                'Career Advice',
                'Internship Guidance',
                'Study Questions',
                'Learning Resources'
              ].map((item) => (
                <li key={item} className="ai-welcome-list-item">{item}</li>
              ))}
            </ul>
            <p className="ai-welcome-cta">Ask me anything!</p>
            <SuggestedPrompts
              onSelect={handlePromptSelect}
              disabled={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          isUser={message.role === 'user'}
          onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? onRegenerate : undefined}
        />
      ))}

      {loading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
