import React, { useState, useMemo } from 'react';
import { Search, X, Edit3 } from 'lucide-react';
import ConversationCard from './ConversationCard';
import styles from './ConversationList.module.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'archived', label: 'Archived' },
];

const ConversationList = ({
  conversations,
  activeConversation,
  unreadCounts,
  onSelectConversation,
  onFilterChange,
  onSearch,
   onNewConversation,
   loading,
   activeFilter = 'all'
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const q = localSearch.toLowerCase();
      if (q) {
        if (!conv.otherUser?.name?.toLowerCase().includes(q) &&
            !conv.otherUser?.email?.toLowerCase().includes(q) &&
            !conv.lastMessage?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (activeFilter === 'unread') return (unreadCounts[conv._id] || 0) > 0;
      if (activeFilter === 'archived') return conv.isArchived;
      if (activeFilter === 'pinned') return conv.isPinned;
      return !conv.isArchived;
    });
  }, [conversations, localSearch, activeFilter, unreadCounts]);

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const recentConversations = filteredConversations.filter((c) => !c.isPinned);

  return (
    <div className={styles.conversationListContainer}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Messages</h2>
        <button
          className={styles.newMessageBtn}
          onClick={onNewConversation}
          aria-label="Start new conversation"
          title="Start new conversation"
        >
          <Edit3 size={16} />
        </button>
      </div>

      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          placeholder="Search messages..."
          value={localSearch}
          onChange={handleSearchChange}
          className={styles.searchInput}
          aria-label="Search messages"
        />
        {localSearch && (
          <button
            onClick={() => handleSearchChange({ target: { value: '' } })}
            className={styles.searchClear}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.filters} role="group" aria-label="Conversation filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange?.(f.id)}
            className={`${styles.filterButton} ${activeFilter === f.id ? styles.filterButtonActive : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.conversationsScroll}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                <div className={styles.skeletonLine} style={{ width: '90%', marginTop: '6px' }} />
              </div>
            </div>
          ))
        ) : filteredConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p className={styles.emptyText}>
              {localSearch || activeFilter !== 'all'
                ? 'No conversations found'
                : 'No messages yet'}
            </p>
          </div>
        ) : (
          <>
            {pinnedConversations.length > 0 && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Pinned</span>
                {pinnedConversations.map((conv) => (
                  <ConversationCard
                    key={conv._id}
                    conversation={conv}
                    isActive={activeConversation?._id === conv._id}
                    unreadCount={unreadCounts[conv._id] || 0}
                    onClick={() => onSelectConversation(conv)}
                  />
                ))}
              </div>
            )}
            {recentConversations.length > 0 && (
              <div className={styles.section}>
                {pinnedConversations.length > 0 && (
                  <span className={styles.sectionLabel}>Recent</span>
                )}
                {recentConversations.map((conv) => (
                  <ConversationCard
                    key={conv._id}
                    conversation={conv}
                    isActive={activeConversation?._id === conv._id}
                    unreadCount={unreadCounts[conv._id] || 0}
                    onClick={() => onSelectConversation(conv)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
