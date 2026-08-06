import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RefreshCw } from 'lucide-react';

const CodeBlock = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="ai-code-block">
        <div className="ai-code-header">
          <span className="ai-code-language">{match[1]}</span>
          <button onClick={handleCopy} className="ai-code-copy-btn">
            <Copy size={12} />
            Copy
          </button>
        </div>
        <pre className="ai-code-pre">
          <code className={className}>{codeString}</code>
        </pre>
      </div>
    );
  }

  return <code className="ai-inline-code">{children}</code>;
};

const markdownComponents = {
  code: CodeBlock,
  table({ children }) {
    return (
      <div className="ai-table-wrapper">
        <table className="ai-table">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th className="ai-table-th">{children}</th>;
  },
  td({ children }) {
    return <td className="ai-table-td">{children}</td>;
  },
  ul({ children }) {
    return <ul className="ai-list-ul">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="ai-list-ol">{children}</ol>;
  },
  li({ children }) {
    return <li className="ai-list-li">{children}</li>;
  },
  p({ children }) {
    return <p className="ai-md-p">{children}</p>;
  },
  h1({ children }) {
    return <h1 className="ai-md-h1">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="ai-md-h2">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="ai-md-h3">{children}</h3>;
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="ai-md-link">
        {children}
      </a>
    );
  }
};

const MessageBubble = ({ message, isUser, onRegenerate }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`ai-message-row ${isUser ? 'ai-message-row-user' : 'ai-message-row-ai'}`}
    >
      <div className={`ai-message-wrapper ${isUser ? 'ai-message-wrapper-user' : 'ai-message-wrapper-ai'}`}>
        {!isUser && (
          <div className="ai-message-avatar">
            <span className="ai-message-avatar-text">AI</span>
          </div>
        )}
        <div className="ai-message-content">
          <div
            className={`ai-message-bubble ${isUser ? 'ai-message-bubble-user' : 'ai-message-bubble-ai'}`}
          >
            {isUser ? (
              <p className="ai-message-text">{message.content}</p>
            ) : (
              <div className="ai-message-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <div className={`ai-message-meta ${isUser ? 'ai-message-meta-user' : 'ai-message-meta-ai'}`}>
            <span className="ai-message-time">{formatTime(message.timestamp)}</span>
            {!isUser && (
              <div className="ai-message-actions">
                <button
                  onClick={handleCopy}
                  className="ai-message-action-btn"
                  aria-label="Copy message"
                >
                  {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="ai-message-action-btn"
                    aria-label="Regenerate response"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {isUser && (
          <div className="ai-message-avatar-user">
            <span className="ai-message-avatar-text">You</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
