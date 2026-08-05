import React, { useState, useEffect } from 'react';
import { useMessages } from '../../../context/MessageContext';
import ConversationList from '../../../components/messages/ConversationList';
import ChatWindow from '../../../components/messages/ChatWindow';
import ConversationInfo from '../../../components/messages/ConversationInfo';
import SharedFiles from '../../../components/messages/SharedFiles';
import SharedImages from '../../../components/messages/SharedImages';
import EmptyChat from '../../../components/messages/EmptyChat';
import styles from './Messages.module.css';

const Messages = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    loading,
    messages,
    unreadCounts,
    fetchConversations,
    fetchMessages,
    archiveConversation,
    pinConversation,
    muteConversation,
    deleteConversation
  } = useMessages();

  const [showInfo, setShowInfo] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeInfoTab, setActiveInfoTab] = useState('details');

  useEffect(() => {
    fetchConversations(filter);
  }, [filter]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      setShowInfo(false);
    }
  }, [activeConversation]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
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
  };

  return (
    <div className={`${styles.messagesLayout} ${activeConversation ? styles.hasActiveConversation : ''}`}>
      <div className={`${styles.conversationsColumn} card`}>
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          unreadCounts={unreadCounts}
          onSelectConversation={handleSelectConversation}
          loading={loading}
        />
      </div>

      <div className={`${styles.chatColumn} card`}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            showInfo={showInfo}
            onToggleInfo={() => setShowInfo(!showInfo)}
            onBack={handleBack}
          />
        ) : (
          <EmptyChat />
        )}
      </div>

      {activeConversation && (
        <div className={`${styles.infoColumn} card`}>
          <div className={styles.infoTabs}>
            <button
              onClick={() => setActiveInfoTab('details')}
              className={`${styles.infoTab} ${activeInfoTab === 'details' ? styles.infoTabActive : ''}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveInfoTab('files')}
              className={`${styles.infoTab} ${activeInfoTab === 'files' ? styles.infoTabActive : ''}`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveInfoTab('images')}
              className={`${styles.infoTab} ${activeInfoTab === 'images' ? styles.infoTabActive : ''}`}
            >
              Images
            </button>
          </div>
          <div className={styles.infoContent}>
            {activeInfoTab === 'details' && (
              <ConversationInfo
                conversation={activeConversation}
                onAction={handleConversationAction}
              />
            )}
            {activeInfoTab === 'files' && (
              <SharedFiles
                messages={messages}
              />
            )}
            {activeInfoTab === 'images' && (
              <SharedImages
                messages={messages}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
