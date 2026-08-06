import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

const ChatInput = ({ value, onChange, onSend, loading, disabled, inputRef }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  const canSend = !disabled && !loading && value.trim().length > 0;

  return (
    <div className="ai-chat-input-wrapper">
      <div className="ai-chat-input-container">
        <textarea
          ref={inputRef || textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask InternLink AI..."
          disabled={disabled || loading}
          rows={1}
          className="ai-chat-textarea"
          style={{ minHeight: '48px', maxHeight: '200px' }}
          aria-label="Message input"
        />
        <motion.button
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
          onClick={() => onSend(value)}
          disabled={!canSend}
          className={`ai-chat-send-btn ${canSend ? 'ai-chat-send-btn-active' : ''}`}
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </motion.button>
      </div>
      <p className="ai-chat-input-hint">
        Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
      </p>
    </div>
  );
};

export default ChatInput;
