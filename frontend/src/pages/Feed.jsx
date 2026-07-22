import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader, { CardSkeleton } from '../components/Loader';
import {
  Image as ImageIcon,
  Send,
  ThumbsUp,
  MessageCircle,
  Trash2,
  X,
  Palette,
  ChevronDown,
  ChevronUp,
  CornerDownRight
} from 'lucide-react';

const BG_COLORS = [
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Green', color: '#10b981' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Teal', color: '#14b8a6' },
];

const Feed = () => {
  const { user } = useAuth();
  const { emitNotificationAlert } = useSocket();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  // Post creation
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedBg, setSelectedBg] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef();

  // Comments & Replies
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showAllReplies, setShowAllReplies] = useState({});
  const [activeReply, setActiveReply] = useState({});
  const [visibleCommentCount, setVisibleCommentCount] = useState({});
  const limit = 5;

  const [nestedReplyInputs, setNestedReplyInputs] = useState({});
const [activeNestedReply, setActiveNestedReply] = useState({});
const [showAllNestedReplies, setShowAllNestedReplies] = useState({});

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        const res = await api.get(`/posts?limit=${limit}&skip=0`);
        setPosts(res.data);
        setSkip(limit);
        setHasMore(res.data.length === limit);
      } else {
        setLoadingMore(true);
        const res = await api.get(`/posts?limit=${limit}&skip=${skip}`);
        setPosts((prev) => [...prev, ...res.data]);
        setSkip((prev) => prev + limit);
        setHasMore(res.data.length === limit);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImageSelection = () => {
    setNewPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImage) return;

    setPosting(true);
    const formData = new FormData();
    formData.append('content', newPostText);
    if (newPostImage) formData.append('postImage', newPostImage);
    if (selectedBg) formData.append('backgroundColor', selectedBg);

    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPosts((prev) => [res.data, ...prev]);
      setNewPostText('');
      clearImageSelection();
      setSelectedBg('');
    } catch (err) {
      alert('Post creation failed.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const postIndex = posts.findIndex((p) => p._id === postId);
      if (postIndex === -1) return;
      const targetPost = posts[postIndex];
      const hasLiked = targetPost.likes.includes(user._id);
      const updatedLikes = hasLiked
        ? targetPost.likes.filter((id) => id !== user._id)
        : [...targetPost.likes, user._id];
      const updatedPostsList = [...posts];
      updatedPostsList[postIndex] = { ...targetPost, likes: updatedLikes };
      setPosts(updatedPostsList);
      const res = await api.put(`/posts/${postId}/like`);
      updatedPostsList[postIndex] = res.data;
      setPosts([...updatedPostsList]);
      if (!hasLiked && res.data.author._id !== user._id) {
        emitNotificationAlert(res.data.author._id, { type: 'like', content: `${user.name} liked your post.` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const handlePostReply = async (postId, commentId) => {
    const text = replyInputs[`${postId}-${commentId}`];
    if (!text || !text.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments/${commentId}/reply`, { text });
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
      setReplyInputs((prev) => ({ ...prev, [`${postId}-${commentId}`]: '' }));
      setActiveReply((prev) => ({ ...prev, [commentId]: false }));
    } catch (err) {
      alert('Failed to add reply');
    }
  };
const handleNestedReply = async (postId, commentId, parentReplyId) => {
  const text = nestedReplyInputs[`${postId}-${commentId}-${parentReplyId}`];
  if (!text || !text.trim()) return;
  try {
    // Use the existing /reply endpoint
    const res = await api.post(`/posts/${postId}/comments/${commentId}/reply`, { 
      text,
      // Add a flag to identify nested replies
      isNestedReply: true,
      parentReplyId: parentReplyId 
    });
    setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
    setNestedReplyInputs((prev) => ({ ...prev, [`${postId}-${commentId}-${parentReplyId}`]: '' }));
    setActiveNestedReply((prev) => ({ ...prev, [`${commentId}-${parentReplyId}`]: false }));
  } catch (err) {
    alert('Failed to add reply');
  }
};

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      await api.delete(`/posts/${postId}`);
    } catch (err) {
      fetchPosts(true);
    }
  };

  const toggleComments = (postId) => {
  setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  // Reset visible count when expanding
  if (!expandedComments[postId]) {
    setVisibleCommentCount((prev) => ({ ...prev, [postId]: 2 }));
  }
};

const showMoreComments = (postId) => {
  setVisibleCommentCount((prev) => ({ 
    ...prev, 
    [postId]: (prev[postId] || 2) + 2 
  }));
};

  const toggleShowReplies = (commentId) => {
    setShowAllReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const toggleShowNestedReplies = (replyId) => {
  setShowAllNestedReplies((prev) => ({ ...prev, [replyId]: !prev[replyId] }));
};

  const getTotalCommentCount = (post) => {
  let count = post.comments?.length || 0;
  post.comments?.forEach(comment => {
    count += comment.replies?.length || 0;
    comment.replies?.forEach(reply => {
      count += reply.nestedReplies?.length || 0;
    });
  });
  return count;
};

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Create Post Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <form onSubmit={handleCreatePost}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <textarea
              placeholder="Share your thoughts..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              style={{
                flex: 1, backgroundColor: 'transparent', border: 'none',
                color: 'var(--text-primary)', resize: 'none', height: '60px',
                fontSize: '0.95rem', outline: 'none', paddingTop: '8px'
              }}
            />
          </div>

          {/* Background color preview */}
          {selectedBg && !imagePreview && (
            <div style={{ marginTop: '12px', padding: '20px', borderRadius: '12px', backgroundColor: selectedBg, minHeight: '60px' }}>
              <p style={{ color: '#fff', fontSize: '0.95rem', opacity: 0.9 }}>{newPostText || 'Your post will appear here...'}</p>
            </div>
          )}

          {imagePreview && (
            <div style={{ position: 'relative', marginTop: '12px', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
              <button type="button" onClick={clearImageSelection} style={{
                position: 'absolute', top: '8px', right: '8px',
                backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: '50%', padding: '4px'
              }}><X size={14} /></button>
            </div>
          )}

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => fileInputRef.current.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <ImageIcon size={18} style={{ color: 'var(--primary)' }} /> Photo
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />

              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Palette size={18} style={{ color: 'var(--primary)' }} /> Color
                </button>
                {showColorPicker && (
                  <div style={{
                    position: 'absolute', top: '30px', left: 0, display: 'flex', gap: '6px',
                    padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px',
                    border: '1px solid var(--border-color)', zIndex: 10, boxShadow: 'var(--shadow-lg)'
                  }}>
                    <button type="button" onClick={() => { setSelectedBg(''); setShowColorPicker(false); }}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border-color)', background: 'transparent' }} />
                    {BG_COLORS.map((c) => (
                      <button key={c.color} type="button" onClick={() => { setSelectedBg(c.color); setShowColorPicker(false); }}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c.color, border: selectedBg === c.color ? '2px solid #fff' : '2px solid transparent' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary"
              disabled={posting || (!newPostText.trim() && !newPostImage)}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}>
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      {loading && posts.length === 0 ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <div key={post._id} className="card" style={{ marginBottom: '20px', padding: '20px' }}>
              
              {/* Post Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div onClick={() => window.location.href = `/profile/${post.author._id}`}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', cursor: 'pointer' }}>
                    {post.author.avatar ? (
                      <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 onClick={() => window.location.href = `/profile/${post.author._id}`}
                      style={{ fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>{post.author.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {post.author.headline || 'Student'} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {post.author._id === user._id && (
                  <button onClick={() => handleDeletePost(post._id)} style={{ color: 'var(--text-muted)', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Post Content with background */}
              <div style={{
                borderRadius: '12px', overflow: 'hidden', marginBottom: '14px',
                backgroundColor: post.backgroundColor || 'transparent',
                ...(post.backgroundColor ? { padding: '20px' } : {})
              }}>
                <p style={{
                  color: post.backgroundColor ? '#fff' : 'var(--text-primary)',
                  fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6'
                }}>
                  {post.content}
                </p>
              </div>

              {/* Post Image - FULL display */}
              {post.image && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
                  <img src={post.image} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
                </div>
              )}

              {/* Action Counters */}
            <div style={{
  display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)',
  fontSize: '0.8rem', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '10px'
}}>
  <span>{post.likes?.length || 0} Likes</span>
  <span onClick={() => toggleComments(post._id)} style={{ cursor: 'pointer' }}>
    {getTotalCommentCount(post)} Comments {/* ← UPDATED */}
  </span>
</div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                <button onClick={() => handleLike(post._id)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem',
                  color: post.likes?.includes(user._id) ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: post.likes?.includes(user._id) ? 600 : 500
                }}><ThumbsUp size={16} /> Like</button>
                <button onClick={() => toggleComments(post._id)} style={{
  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)'
}}><MessageCircle size={16} /> Comment ({getTotalCommentCount(post)})</button>
              </div>

              {/* Comments Section */}
              {expandedComments[post._id] && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  
                  {/* New Comment Input */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input type="text" placeholder="Write a comment..."
                      value={commentInputs[post._id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                      style={{
                        flex: 1, padding: '8px 16px', backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)', fontSize: '0.85rem'
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(post._id); }} />
                    <button onClick={() => handlePostComment(post._id)}
                      disabled={!commentInputs[post._id]?.trim()}
                      style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex' }}>
                      <Send size={14} />
                    </button>
                  </div>
  {/* Comments List */}
{post.comments?.length > 0 ? (
  <>
    {/* Show only visible comments (2 initially) */}
    {post.comments.slice(0, visibleCommentCount[post._id] || 2).map((comment) => {
      const replies = comment.replies || [];
      const showAll = showAllReplies[comment._id];
      const visibleReplies = showAll ? replies : replies.slice(0, 2);
      const hasMoreReplies = replies.length > 2;

      return (
        <div key={comment._id} style={{ marginBottom: '16px' }}>
          {/* Main Comment */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            {/* Comment Avatar */}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', flexShrink: 0 }}>
              {comment.user?.avatar ? (
                <img src={comment.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {comment.user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '12px' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 600 }}>{comment.user?.name}</h5>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>{comment.text}</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px', paddingLeft: '4px' }}>
                <button 
                  onClick={() => setActiveReply(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                  style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}
                >
                  Reply {comment.replies?.length > 0 && `(${comment.replies.length})`}
                </button>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Reply Input for Comment */}
              {activeReply[comment._id] && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', marginLeft: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Write a reply..."
                    value={replyInputs[`${post._id}-${comment._id}`] || ''}
                    onChange={(e) => setReplyInputs(prev => ({ ...prev, [`${post._id}-${comment._id}`]: e.target.value }))}
                    style={{
                      flex: 1, padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)', fontSize: '0.8rem'
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePostReply(post._id, comment._id); }} 
                  />
                  <button 
                    onClick={() => handlePostReply(post._id, comment._id)}
                    style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex' }}
                  >
                    <Send size={12} />
                  </button>
                </div>
              )}

              {/* ===== REPLIES (Level 1) ===== */}
              {visibleReplies.map((reply) => {
                const nestedReplies = reply.nestedReplies || [];
                const showAllNested = showAllNestedReplies[reply._id];
                const visibleNestedReplies = showAllNested ? nestedReplies : nestedReplies.slice(0, 2);
                const hasMoreNested = nestedReplies.length > 2;

                return (
                  <div key={reply._id} style={{ marginTop: '8px', marginLeft: '12px' }}>
                    {/* Reply Container */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <CornerDownRight size={14} style={{ color: 'var(--text-muted)', marginTop: '6px', flexShrink: 0 }} />
                      
                      {/* Reply Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '10px' }}>
                          {/* Reply Avatar */}
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, marginTop: '2px' }}>
                            {reply.user?.avatar ? (
                              <img src={reply.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 600 }}>
                                {reply.user?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h5 style={{ fontSize: '0.75rem', fontWeight: 600 }}>{reply.user?.name}</h5>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{reply.text}</p>
                          </div>
                        </div>

                        {/* Reply Actions */}
                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px', paddingLeft: '8px' }}>
                          <button 
                            onClick={() => setActiveNestedReply(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: !prev[`${comment._id}-${reply._id}`] }))}
                            style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}
                          >
                            Reply {nestedReplies.length > 0 && `(${nestedReplies.length})`}
                          </button>
                        </div>

                        {/* ===== NESTED REPLIES (Level 2) ===== */}
                        {visibleNestedReplies.map((nestedReply) => (
                          <div key={nestedReply._id} style={{ marginTop: '8px', marginLeft: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <CornerDownRight size={12} style={{ color: 'var(--text-muted)', marginTop: '6px', flexShrink: 0 }} />
                              <div style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {/* Nested Reply Avatar */}
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, marginTop: '2px' }}>
                                    {nestedReply.user?.avatar ? (
                                      <img src={nestedReply.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.6rem', fontWeight: 600 }}>
                                        {nestedReply.user?.name?.charAt(0).toUpperCase() || '?'}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <h5 style={{ fontSize: '0.7rem', fontWeight: 600 }}>{nestedReply.user?.name}</h5>
                                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                                        {new Date(nestedReply.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>{nestedReply.text}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* See More Nested Replies */}
                        {hasMoreNested && (
                          <button 
                            onClick={() => toggleShowNestedReplies(reply._id)}
                            style={{ fontSize: '0.65rem', color: 'var(--primary)', marginLeft: '20px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {showAllNested ? (
                              <><ChevronUp size={12} /> Show less</>
                            ) : (
                              <><ChevronDown size={12} /> See {nestedReplies.length - 2} more replies</>
                            )}
                          </button>
                        )}

                        {/* Nested Reply Input */}
                        {activeNestedReply[`${comment._id}-${reply._id}`] && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', marginLeft: '20px' }}>
                            <input 
                              type="text" 
                              placeholder="Write a reply..."
                              value={nestedReplyInputs[`${post._id}-${comment._id}-${reply._id}`] || ''}
                              onChange={(e) => setNestedReplyInputs(prev => ({ ...prev, [`${post._id}-${comment._id}-${reply._id}`]: e.target.value }))}
                              style={{
                                flex: 1, padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)', fontSize: '0.75rem'
                              }}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleNestedReply(post._id, comment._id, reply._id); }} 
                            />
                            <button 
                              onClick={() => handleNestedReply(post._id, comment._id, reply._id)}
                              style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex' }}
                            >
                              <Send size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* See More Replies for Comment */}
              {hasMoreReplies && (
                <button 
                  onClick={() => toggleShowReplies(comment._id)}
                  style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '28px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {showAll ? (
                    <><ChevronUp size={12} /> Show less</>
                  ) : (
                    <><ChevronDown size={12} /> See {replies.length - 2} more replies</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    })}
    
    {/* See More / See Less for Comments */}
    {post.comments.length > 2 && (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        {(visibleCommentCount[post._id] || 2) < post.comments.length ? (
          <button 
            onClick={() => showMoreComments(post._id)}
            style={{
              color: 'var(--primary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ChevronDown size={14} /> 
            See {post.comments.length - (visibleCommentCount[post._id] || 2)} more comments
          </button>
        ) : (
          <button 
            onClick={() => setVisibleCommentCount(prev => ({ ...prev, [post._id]: 2 }))}
            style={{
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.8rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ChevronUp size={14} /> Show less
          </button>
        )}
      </div>
    )}
  </>
) : (
  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No comments yet.</p>
)}
                              
                              
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button onClick={() => fetchPosts(false)} className="btn btn-secondary"
              disabled={loadingMore} style={{ width: '100%', padding: '10px' }}>
              {loadingMore ? 'Loading...' : 'Load More Posts'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <p>No posts yet. Share your first update!</p>
        </div>
      )}
    </div>
  );
};

export default Feed;