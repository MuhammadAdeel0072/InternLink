import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { sendMessage } from '../services/aiService';

const AIContext = createContext();

const INITIAL_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: `Hello! I'm InternLink AI. I'm here to help you with Programming, Resume Review, Interview Preparation, Career Advice, Internship Guidance, Study Questions, and Learning Resources. Ask me anything!`,
  timestamp: new Date().toISOString()
};

let messageIdCounter = 1;
const generateId = () => `msg_${Date.now()}_${messageIdCounter++}`;

export const AIContextProvider = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const sendChatMessage = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loadingRef.current) return;

    setError(null);
    setShowWelcome(false);

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    loadingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 30000);

    try {
      const response = await sendMessage(trimmed, abortControllerRef.current.signal);
      clearTimeout(timeoutId);
      const aiMessage = {
        id: generateId(),
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
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }]);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
      abortControllerRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const regenerateLastMessage = useCallback(() => {
    let lastUserMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i];
        break;
      }
    }

    if (!lastUserMessage) return;

    setMessages(prev => {
      const newMessages = [...prev];
      let lastUserIndex = -1;
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }
      if (lastUserIndex >= 0) {
        return newMessages.slice(0, lastUserIndex + 1);
      }
      return prev;
    });

    setTimeout(() => {
      sendChatMessage(lastUserMessage.content);
    }, 50);
  }, [messages, sendChatMessage]);

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([{ ...INITIAL_MESSAGE, id: generateId(), timestamp: new Date().toISOString() }]);
    setShowWelcome(true);
    setInput('');
    setError(null);
    setLoading(false);
    loadingRef.current = false;
  }, []);

  return (
    <AIContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        messages,
        input,
        setInput,
        loading,
        error,
        showWelcome,
        setShowWelcome,
        sendMessage: sendChatMessage,
        regenerateLastMessage,
        clearChat,
        messagesEndRef,
        inputRef
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => useContext(AIContext);
