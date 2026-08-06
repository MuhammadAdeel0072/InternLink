import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SuggestedPrompts from './SuggestedPrompts';
import ChatInput from './ChatInput';
import { sendMessage } from '../../services/aiService';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `Hello 👋\nI'm InternLink AI.\n\nI can help you with:\n\n• Programming\n• Resume Review\n• Career Guidance\n• Interview Preparation\n• Study Questions\n• Internships\n\nHow can I help today?`,
  timestamp: new Date().toISOString()
};

const AIChat = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleSend = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 30000);

    setError(null);
    setShowPrompts(false);

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(trimmed, abortControllerRef.current.signal);
      clearTimeout(timeoutId);
      const aiMessage = {
        role: 'assistant',
        content: response.reply || 'I received your message but could not generate a response.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'CanceledError' || err.name === 'AbortError';
      if (!isAbort) {
        const errorMessage = err.message || 'Something went wrong. Please try again.';
        setError(errorMessage);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading]);

  const handlePromptSelect = useCallback((prompt) => {
    setInput(prompt);
    handleSend(prompt);
  }, [handleSend]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-bg-primary">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 bg-bg-secondary/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary font-display">InternLink AI</h1>
            <p className="text-xs text-text-secondary">Your Career & Study Assistant</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {showPrompts && messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                <SuggestedPrompts onSelect={handlePromptSelect} disabled={loading} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.role + '-' + index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <MessageBubble
                  message={message}
                  isUser={message.role === 'user'}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-4">
          <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        </div>
      )}

      {/* Input Section */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => handleSend()}
        loading={loading}
        disabled={false}
        inputRef={inputRef}
      />
    </div>
  );
};

export default AIChat;
