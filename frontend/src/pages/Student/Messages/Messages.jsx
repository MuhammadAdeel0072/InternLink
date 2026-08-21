import React, { useState, useEffect } from 'react';
import { useMessages } from '../../../context/MessageContext';
import { useNavigate, useParams } from 'react-router-dom';
import ConversationList from '../../../components/messages/ConversationList';
import ChatWindow from '../../../components/messages/ChatWindow';
import EmptyChat from '../../../components/messages/EmptyChat';
import styles from './Messages.module.css';

const Messages = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    loading,
    unreadCounts,
    fetchConversations,
    fetchMessages,
    archiveConversation,
    pinConversation,
    muteConversation,
    deleteConversation,
    sendMessageError
  } = useMessages();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [filter, setFilter] = useState('all');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetchConversations(filter);
  }, [filter, fetchConversations]);

  useEffect(() => {
    if (conversationId && activeConversation?._id !== conversationId) {
      const found = conversations.find((c) => c._id === conversationId);
      if (found) {
        setActiveConversation(found);
      }
    }
  }, [conversationId, conversations, activeConversation, setActiveConversation]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      setShowInfo(false);
    }
  }, [activeConversation, fetchMessages]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setShowInfo(false);
    navigate(`/messages/${conv._id}`);
  };

  const handleConversationAction = async (actionType, conversationId) => {
    try {
      switch (actionType) {
        case 'pin':
          await pinConversation(conversationId);
          break;
        case 'mute':
          await muteConversation(conversationId);
          break;
        case 'archive':
          await archiveConversation(conversationId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this conversation?')) {
            await deleteConversation(conversationId);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to ${actionType}:`, error);
    }
  };

  const handleBack = () => {
    setActiveConversation(null);
    setShowInfo(false);
    navigate('/messages');
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleNewConversation = () => {
    navigate('/network');
  };

  return (
    <div className={`${styles.messagesLayout} ${activeConversation ? styles.hasActiveConversation : ''}`}>
      <aside className={styles.conversationsPanel}>
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          unreadCounts={Object.fromEntries(
            conversations.map((c) => [c._id, unreadCounts(c._id)])
          )}
          onSelectConversation={handleSelectConversation}
          onFilterChange={handleFilterChange}
          onNewConversation={handleNewConversation}
          loading={loading}
          activeFilter={filter}
        />
      </aside>

      <main className={styles.chatPanel}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            showInfo={showInfo}
            onToggleInfo={() => setShowInfo(!showInfo)}
            onBack={handleBack}
          />
        ) : (
          <EmptyChat onStartNew={handleNewConversation} />
        )}
      </main>
    </div>
  );
};

export default Messages;
