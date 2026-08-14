import React, { useState, useEffect, useRef, memo } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { CardSkeleton } from '../../../components/Loader/Loader';
import styles from './Feed.module.css';
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
  CornerDownRight,
  Edit3,
  MoreHorizontal,
  Check
} from 'lucide-react';

const BG_COLORS = [
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Green', color: '#10b981' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Teal', color: '#14b8a6' },
];

const Feed = memo(() => {
  const { user } = useAuth();
  const { emitNotificationAlert } = useSocket();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedBg, setSelectedBg] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef();

  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showAllReplies, setShowAllReplies] = useState({});
  const [activeReply, setActiveReply] = useState({});
  const [visibleCommentCount, setVisibleCommentCount] = useState({});
  const limit = 5;

  const [editingComment, setEditingComment] = useState({});
  const [editingReply, setEditingReply] = useState({});
  const [collapsedReplies, setCollapsedReplies] = useState({});
  const [editCommentText, setEditCommentText] = useState({});
  const [editReplyText, setEditReplyText] = useState({});
  const [commentMenu, setCommentMenu] = useState({});

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        const res = await api.get(`/posts?limit=${limit}&skip=0`);
        const postsData = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setPosts(postsData);
        setSkip(limit);
        setHasMore(postsData.length === limit);
      } else {
        setLoadingMore(true);
        const res = await api.get(`/posts?limit=${limit}&skip=${skip}`);
        const postsData = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setPosts((prev) => [...prev, ...postsData]);
        setSkip((prev) => prev + limit);
        setHasMore(postsData.length === limit);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err.message || err);
      // Only show user-facing alert on initial load, not on pagination
      if (reset && posts.length === 0) {
        // Non-blocking error — the UI handles empty state gracefully
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const createdPost = res.data.data || res.data;
      setPosts((prev) => [createdPost, ...prev]);
      setNewPostText('');
      clearImageSelection();
      setSelectedBg('');
    } catch (_err) {
      console.error(_err);
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
      const hasLiked = targetPost.likes?.some(id => id?.toString() === user._id.toString());
       const updatedLikes = hasLiked
        ? targetPost.likes.filter((id) => id.toString() !== user._id.toString())
        : [...(targetPost.likes || []), user._id];
      const updatedPostsList = [...posts];
      updatedPostsList[postIndex] = { ...targetPost, likes: updatedLikes };
      setPosts(updatedPostsList);
      const res = await api.put(`/posts/${postId}/like`);
      const updatedPost = res.data.data || res.data;
      updatedPostsList[postIndex] = updatedPost;
      setPosts([...updatedPostsList]);
      if (!hasLiked && updatedPost.author?._id !== user._id) {
        emitNotificationAlert(updatedPost.author._id, { type: 'like', content: `${user.name} liked your post.` });
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
      setPosts((prev) => prev.map((p) => (p._id === postId ? (res.data.data || res.data) : p)));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (_err) {
      console.error(_err);
      alert('Failed to add comment');
    }
  };

  const handlePostReply = async (postId, commentId) => {
    const text = replyInputs[`${postId}-${commentId}`];
    if (!text || !text.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments/${commentId}/reply`, { text });
      setPosts((prev) => prev.map((p) => (p._id === postId ? (res.data.data || res.data) : p)));
      setReplyInputs((prev) => ({ ...prev, [`${postId}-${commentId}`]: '' }));
      setActiveReply((prev) => ({ ...prev, [commentId]: false }));
    } catch (_err) {
      console.error(_err);
      alert('Failed to add reply');
    }
  };

  const handleEditComment = async (postId, commentId) => {
    const text = editCommentText[commentId];
    if (!text || !text.trim()) return;
    try {
      const res = await api.put(`/posts/${postId}/comments/${commentId}`, { text });
      setPosts((prev) => prev.map((p) => (p._id === postId ? (res.data.data || res.data) : p)));
      setEditingComment((prev) => ({ ...prev, [commentId]: false }));
      setEditCommentText((prev) => ({ ...prev, [commentId]: '' }));
    } catch (_err) {
      console.error(_err);
      alert('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await api.delete(`/posts/${postId}/comments/${commentId}`);
      setPosts((prev) => prev.map((p) => (p._id === postId ? (res.data.data || res.data) : p)));
    } catch (_err) {
      console.error(_err);
      alert('Failed to delete comment');
    }
  };

  const handleEditReply = async (postId, commentId, replyId) => {
    const text = editReplyText[`${commentId}-${replyId}`];
    if (!text || !text.trim()) return;
    try {
      const res = await api.put(`/posts/${postId}/comments/${commentId}/replies/${replyId}`, { text });
      setPosts((prev) => prev.map((p) => (p._id === postId ? (res.data.data || res.data) : p)));
      setEditingReply((prev) => ({ ...prev, [`${commentId}-${replyId}`]: false }));
      setEditReplyText((prev) => ({ ...prev, [`${commentId}-${replyId}`]: '' }));
    } catch (_err) {
      console.error(_err);
      alert('Failed to edit reply');
    }
  };

  const handleDeleteReply = async (postId, commentId, replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      const res = await api.delete(`/posts/${postId}/comments/${commentId}/replies/${replyId}`);
      setPosts((prev) => prev.map((p) => (p._id === postId ? (res.data.data || res.data) : p)));
    } catch (_err) {
      console.error(_err);
      alert('Failed to delete reply');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (_err) {
      console.error(_err);
      fetchPosts(true);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
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

  const toggleCollapseReplies = (commentId) => {
    setCollapsedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const toggleCommentMenu = (commentId) => {
    setCommentMenu((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const getTotalCommentCount = (post) => {
    let count = post.comments?.length || 0;
    post.comments?.forEach(comment => {
      count += comment.replies?.length || 0;
    });
    return count;
  };

  const isOwner = (itemUserId) => itemUserId?.toString() === user?._id?.toString();

  return (
    <div className={styles.feedContainer}>
      
      {/* Create Post Card */}
      <div className={`card ${styles.createPostCard}`}>
        <form onSubmit={handleCreatePost} className={styles.postForm}>
          <div className={styles.postFormRow}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <textarea
              placeholder="Share your thoughts..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className={styles.postTextarea}
            />
          </div>

          {selectedBg && !imagePreview && (
            <div className={styles.bgPreview} style={{ backgroundColor: selectedBg }}>
              <p className={styles.bgPreviewText}>{newPostText || 'Your post will appear here...'}</p>
            </div>
          )}

          {imagePreview && (
            <div className={styles.imagePreviewContainer}>
              <img src={imagePreview} alt="preview" className={styles.imagePreview} />
              <button type="button" onClick={clearImageSelection} className={styles.imageClearBtn} aria-label="Remove image">
                 <X size={14} />
               </button>
            </div>
          )}

          <div className={styles.postActions}>
            <div className={styles.postActionButtons}>
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className={styles.actionBtn}
              >
                <ImageIcon size={18} style={{ color: 'var(--primary)' }} /> Photo
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />

              <div className={styles.colorPickerWrapper}>
                <button 
                  type="button" 
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={styles.actionBtn}
                >
                  <Palette size={18} style={{ color: 'var(--primary)' }} /> Color
                </button>
                {showColorPicker && (
                  <div className={styles.colorPickerDropdown}>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedBg(''); setShowColorPicker(false); }}
                      className={styles.clearColorBtn} 
                    />
                    {BG_COLORS.map((c) => (
                      <button 
                        key={c.color} 
                        type="button" 
                        onClick={() => { setSelectedBg(c.color); setShowColorPicker(false); }}
                        className={`${styles.colorOption} ${selectedBg === c.color ? styles.selected : ''}`}
                        style={{ backgroundColor: c.color }} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={posting || (!newPostText.trim() && !newPostImage)}
            >
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
            <div key={post._id} className={`card ${styles.postCard}`}>
              
              {/* Post Header */}
              <div className={styles.postHeader}>
                <div className={styles.postAuthor}>
                  <div 
                    onClick={() => window.location.href = `/profile/${post.author._id}`}
                    className={styles.authorAvatar}
                  >
                    {post.author.avatar ? (
                      <img src={post.author.avatar} alt="" loading="lazy" />
                    ) : (
                      <div className={styles.authorAvatarFallback}>
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.authorInfo}>
                    <h4 
                      onClick={() => window.location.href = `/profile/${post.author._id}`}
                      className={styles.authorName}
                    >
                      {post.author.name}
                    </h4>
                    <p className={styles.postMeta}>
                      {post.author.headline || 'Student'} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {post.author._id === user._id && (
                  <button onClick={() => handleDeletePost(post._id)} className={styles.deleteBtn} aria-label="Delete post">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Post Content with background */}
              <div 
                className={`${styles.postContent} ${post.backgroundColor ? styles.postContentWithBg : ''}`}
                style={post.backgroundColor ? { backgroundColor: post.backgroundColor } : {}}
              >
                <p className={`${styles.postText} ${post.backgroundColor ? styles.postTextLight : styles.postTextDark}`}>
                  {post.content}
                </p>
              </div>

              {/* Post Image */}
              {post.image && (
                <div className={styles.postImage}>
                  <img src={post.image} alt="" loading="lazy" />
                </div>
              )}

              {/* Action Counters */}
              <div className={styles.actionCounters}>
                <span>{post.likes?.length || 0} Likes</span>
                <span onClick={() => toggleComments(post._id)} className={styles.commentCount}>
                  {getTotalCommentCount(post)} Comments
                </span>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button 
                  onClick={() => handleLike(post._id)} 
                  className={`${styles.likeBtn} ${post.likes?.some(id => id?.toString() === user._id?.toString()) ? styles.liked : styles.unliked}`}
                >
                  <ThumbsUp size={16} /> Like
                </button>
                <button 
                  onClick={() => toggleComments(post._id)} 
                  className={styles.commentActionBtn}
                >
                  <MessageCircle size={16} /> Comment ({getTotalCommentCount(post)})
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments[post._id] && (
                <div className={styles.commentsSection}>
                   
                  {/* New Comment Input */}
                  <div className={styles.commentInputWrapper}>
                    <input 
                      type="text" 
                      placeholder="Write a comment..."
                      value={commentInputs[post._id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                      className={styles.commentInput}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(post._id); }} 
                    />
                    <button 
                      onClick={() => handlePostComment(post._id)}
                      disabled={!commentInputs[post._id]?.trim()}
                      className={styles.sendCommentBtn}
                      aria-label="Send comment"
                    >
                      <Send size={14} />
                    </button>
                  </div>

                  {/* Comments List */}
                  {post.comments?.length > 0 ? (
                    <>
                      {post.comments.slice(0, visibleCommentCount[post._id] || 2).map((comment) => {
                        const replies = comment.replies || [];
                        const showAll = showAllReplies[comment._id];
                        const visibleReplies = showAll ? replies : replies.slice(0, 2);
                        const hasMoreReplies = replies.length > 2;
                        const isCollapsed = collapsedReplies[comment._id];
                        const isEditingComment = editingComment[comment._id];
                        const commentMenuOpen = commentMenu[comment._id];

                        return (
                          <div key={comment._id} className={styles.commentItem}>
                            {/* Main Comment */}
                            <div className={styles.commentWrapper}>
                              <div className={styles.commentAvatar}>
                                {comment.user?.avatar ? (
                                  <img src={comment.user.avatar} alt="" />
                                ) : (
                                  <div className={styles.commentAvatarFallback}>
                                    {comment.user?.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className={styles.commentBody}>
                                {isEditingComment ? (
                                  <div className={styles.editInputWrapper}>
                                    <input 
                                      type="text" 
                                      value={editCommentText[comment._id] || ''}
                                      onChange={(e) => setEditCommentText(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                      className={styles.editInput}
                                      autoFocus
                                    />
                                    <div className={styles.editActions}>
                                      <button onClick={() => handleEditComment(post._id, comment._id)} className={styles.editSaveBtn}><Check size={14} /></button>
                                      <button onClick={() => setEditingComment(prev => ({ ...prev, [comment._id]: false }))} className={styles.editCancelBtn}><X size={14} /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className={styles.commentBubble}>
                                      <h5 className={styles.commentUserName}>{comment.user?.name}</h5>
                                      <p className={styles.commentText}>{comment.text}</p>
                                    </div>
                                    <div className={styles.commentActions}>
                                      <button 
                                        onClick={() => setActiveReply(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                                        className={styles.replyBtn}
                                      >
                                        Reply {replies.length > 0 && `(${replies.length})`}
                                      </button>
                                      {replies.length > 0 && (
                                        <button 
                                          onClick={() => toggleCollapseReplies(comment._id)}
                                          className={styles.collapseBtn}
                                        >
                                          {isCollapsed ? <><ChevronDown size={12} /> Show replies</> : <><ChevronUp size={12} /> Hide replies</>}
                                        </button>
                                      )}
                                      <span className={styles.commentDate}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                      {isOwner(comment.user?._id) && (
                                        <div className={styles.commentMenuWrapper}>
                                          <button onClick={() => toggleCommentMenu(comment._id)} className={styles.commentMenuBtn}><MoreHorizontal size={14} /></button>
                                          {commentMenuOpen && (
                                            <div className={styles.commentMenu}>
                                              <button onClick={() => { setEditingComment(prev => ({ ...prev, [comment._id]: true })); setEditCommentText(prev => ({ ...prev, [comment._id]: comment.text })); setCommentMenu(prev => ({ ...prev, [comment._id]: false })); }} className={styles.commentMenuItem}><Edit3 size={14} /> Edit</button>
                                              <button onClick={() => { handleDeleteComment(post._id, comment._id); setCommentMenu(prev => ({ ...prev, [comment._id]: false })); }} className={`${styles.commentMenuItem} ${styles.commentMenuDanger}`}><Trash2 size={14} /> Delete</button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* Reply Input for Comment */}
                                {activeReply[comment._id] && !isEditingComment && (
                                  <div className={styles.replyInputWrapper}>
                                    <input 
                                      type="text" 
                                      placeholder="Write a reply..."
                                      value={replyInputs[`${post._id}-${comment._id}`] || ''}
                                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [`${post._id}-${comment._id}`]: e.target.value }))}
                                      className={styles.replyInput}
                                      onKeyDown={(e) => { if (e.key === 'Enter') handlePostReply(post._id, comment._id); }} 
                                    />
                                    <button 
                                      onClick={() => handlePostReply(post._id, comment._id)}
                                      className={styles.sendReplyBtn}
                                    >
                                      <Send size={12} />
                                    </button>
                                  </div>
                                )}

                                {/* Replies */}
                                {!isCollapsed && (
                                  <>
                                    {visibleReplies.map((reply) => {
                                      const isEditingReply = editingReply[`${comment._id}-${reply._id}`];
                                      const replyMenuOpen = commentMenu[`${comment._id}-${reply._id}`];

                                      return (
                                        <div key={reply._id} className={styles.replyContainer}>
                                          <div className={styles.replyWrapper}>
                                            <CornerDownRight size={14} className={styles.replyIcon} />
                                            <div className={styles.replyContent}>
                                              {isEditingReply ? (
                                                <div className={styles.editInputWrapper}>
                                                  <input 
                                                    type="text" 
                                                    value={editReplyText[`${comment._id}-${reply._id}`] || ''}
                                                    onChange={(e) => setEditReplyText(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: e.target.value }))}
                                                    className={styles.editInput}
                                                    autoFocus
                                                  />
                                                  <div className={styles.editActions}>
                                                    <button onClick={() => handleEditReply(post._id, comment._id, reply._id)} className={styles.editSaveBtn}><Check size={14} /></button>
                                                    <button onClick={() => setEditingReply(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: false }))} className={styles.editCancelBtn}><X size={14} /></button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <>
                                                  <div className={styles.replyBubble}>
                                                    <div className={styles.replyAvatar}>
                                                      {reply.user?.avatar ? (
                                                        <img src={reply.user.avatar} alt="" />
                                                      ) : (
                                                        <div className={styles.replyAvatarFallback}>
                                                          {reply.user?.name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className={styles.replyMeta}>
                                                      <div className={styles.replyUserInfo}>
                                                        <h5 className={styles.replyUserName}>{reply.user?.name}</h5>
                                                        <span className={styles.replyDate}>
                                                          {new Date(reply.createdAt).toLocaleDateString()}
                                                        </span>
                                                      </div>
                                                      <p className={styles.replyText}>{reply.text}</p>
                                                    </div>
                                                  </div>
                                                  <div className={styles.replyActions}>
                                                    <button 
                                                      onClick={() => setActiveReply(prev => ({ ...prev, [comment._id]: true }))}
                                                      className={styles.replyBtn}
                                                    >
                                                      Reply
                                                    </button>
                                                    <span className={styles.commentDate}>
                                                      {new Date(reply.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {isOwner(reply.user?._id) && (
                                                      <div className={styles.commentMenuWrapper}>
                                                        <button onClick={() => toggleCommentMenu(`${comment._id}-${reply._id}`)} className={styles.commentMenuBtn}><MoreHorizontal size={14} /></button>
                                                        {replyMenuOpen && (
                                                          <div className={styles.commentMenu}>
                                                            <button onClick={() => { setEditingReply(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: true })); setEditReplyText(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: reply.text })); setCommentMenu(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: false })); }} className={styles.commentMenuItem}><Edit3 size={14} /> Edit</button>
                                                            <button onClick={() => { handleDeleteReply(post._id, comment._id, reply._id); setCommentMenu(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: false })); }} className={`${styles.commentMenuItem} ${styles.commentMenuDanger}`}><Trash2 size={14} /> Delete</button>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </>
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
                                        className={styles.seeMoreBtn}
                                      >
                                        {showAll ? (
                                          <><ChevronUp size={12} /> Show less</>
                                        ) : (
                                          <><ChevronDown size={12} /> See {replies.length - 2} more replies</>
                                        )}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* See More / See Less for Comments */}
                      {post.comments.length > 2 && (
                        <div className={styles.commentsSeeMoreWrapper}>
                          {(visibleCommentCount[post._id] || 2) < post.comments.length ? (
                            <button 
                              onClick={() => showMoreComments(post._id)}
                              className={styles.commentsSeeMoreBtn}
                            >
                              <ChevronDown size={14} /> 
                              See {post.comments.length - (visibleCommentCount[post._id] || 2)} more comments
                            </button>
                          ) : (
                            <button 
                              onClick={() => setVisibleCommentCount(prev => ({ ...prev, [post._id]: 2 }))}
                              className={styles.commentsSeeLessBtn}
                            >
                              <ChevronUp size={14} /> Show less
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className={styles.noComments}>No comments yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button 
              onClick={() => fetchPosts(false)} 
              className={`btn btn-secondary ${styles.loadMoreBtn}`}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More Posts'}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.noPosts}>
          <p>No posts yet. Share your first update!</p>
        </div>
      )}
    </div>
  );
});

export default Feed;
