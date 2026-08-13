export const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (target.toDateString() === yesterday.toDateString()) return 'Yesterday';

  if (diffMs < 30 * 24 * 60 * 60 * 1000) {
    return target.toLocaleDateString([], { weekday: 'short' });
  }

  if (target.getFullYear() === now.getFullYear()) {
    return target.toLocaleDateString([], { month: 'short', day: 'd' });
  }

  return target.toLocaleDateString([], { month: 'short', day: 'd', year: 'numeric' });
};

export const formatMessageTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateSeparator = (date) => {
  if (!date) return '';
  const now = new Date();
  const target = new Date(date);

  if (target.toDateString() === now.toDateString()) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (target.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const diffDays = Math.floor((now - target) / (24 * 60 * 60 * 1000));
  if (diffDays < 7) {
    return target.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'd' });
  }

  if (target.getFullYear() === now.getFullYear()) {
    return target.toLocaleDateString([], { month: 'long', day: 'd' });
  }

  return target.toLocaleDateString([], { month: 'long', day: 'd', year: 'numeric' });
};
