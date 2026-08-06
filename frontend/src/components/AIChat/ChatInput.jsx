import React, { useRef, useEffect } from 'react';
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
      onSend();
    }
  };

  return (
    <div className="border-t border-white/10 bg-bg-primary/80 backdrop-blur-xl p-4">
      <div className="max-w-4xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef || textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message InternLink AI..."
            disabled={disabled || loading}
            rows={1}
            className="w-full bg-bg-secondary border border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={disabled || loading || !value.trim()}
          className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-text-muted text-center mt-2">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
};

export default ChatInput;
