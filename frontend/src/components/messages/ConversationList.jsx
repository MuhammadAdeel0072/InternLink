import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import ConversationCard from './ConversationCard';
import styles from './ConversationList.module.css';

const ConversationList = ({
  conversations,
  activeConversation,
  unreadCounts,
  onSelectConversation,
  loading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return conv.otherUser?.name?.toLowerCase().includes(q) ||
        conv.otherUser?.email?.toLowerCase().includes(q);
    }
    if (filter === 'unread') return unreadCounts[conv._id] > 0;
    if (filter === 'archived') return conv.isArchived;
    if (filter === 'pinned') return conv.isPinned;
    return !conv.isArchived;
  });

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const recentConversations = filteredConversations.filter((c) => !c.isPinned);

  return (
    <div className={styles.conversationListContainer}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Messages</h2>
        <span className={styles.headerSubtitle}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className={styles.searchClear}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.filters}>
        {['all', 'unread', 'archived', 'pinned'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterButton} ${filter === f ? styles.filterButtonActive : ''}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.conversationsScroll}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '8px' }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p>No conversations found</p>
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
