import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader, { CardSkeleton } from '../../components/Loader/Loader';
import styles from './Feed.module.css'; // Import CSS Module
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
      const res = await api.post(`/posts/${postId}/comments/${commentId}/reply`, { 
        text,
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

          {/* Background color preview */}
          {selectedBg && !imagePreview && (
            <div className={styles.bgPreview} style={{ backgroundColor: selectedBg }}>
              <p className={styles.bgPreviewText}>{newPostText || 'Your post will appear here...'}</p>
            </div>
          )}

          {imagePreview && (
            <div className={styles.imagePreviewContainer}>
              <img src={imagePreview} alt="preview" className={styles.imagePreview} />
              <button type="button" onClick={clearImageSelection} className={styles.imageClearBtn}>
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
                      <img src={post.author.avatar} alt="" />
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
                  <button onClick={() => handleDeletePost(post._id)} className={styles.deleteBtn}>
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
                  <img src={post.image} alt="" />
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
                  className={`${styles.likeBtn} ${post.likes?.includes(user._id) ? styles.liked : styles.unliked}`}
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

                        return (
                          <div key={comment._id} className={styles.commentItem}>
                            {/* Main Comment */}
                            <div className={styles.commentWrapper}>
                              {/* Comment Avatar */}
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
                                <div className={styles.commentBubble}>
                                  <h5 className={styles.commentUserName}>{comment.user?.name}</h5>
                                  <p className={styles.commentText}>{comment.text}</p>
                                </div>
                                <div className={styles.commentActions}>
                                  <button 
                                    onClick={() => setActiveReply(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                                    className={styles.replyBtn}
                                  >
                                    Reply {comment.replies?.length > 0 && `(${comment.replies.length})`}
                                  </button>
                                  <span className={styles.commentDate}>
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Reply Input for Comment */}
                                {activeReply[comment._id] && (
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

                                {/* ===== REPLIES (Level 1) ===== */}
                                {visibleReplies.map((reply) => {
                                  const nestedReplies = reply.nestedReplies || [];
                                  const showAllNested = showAllNestedReplies[reply._id];
                                  const visibleNestedReplies = showAllNested ? nestedReplies : nestedReplies.slice(0, 2);
                                  const hasMoreNested = nestedReplies.length > 2;

                                  return (
                                    <div key={reply._id} className={styles.replyContainer}>
                                      {/* Reply Container */}
                                      <div className={styles.replyWrapper}>
                                        <CornerDownRight size={14} className={styles.replyIcon} />
                                        
                                        {/* Reply Content */}
                                        <div className={styles.replyContent}>
                                          <div className={styles.replyBubble}>
                                            {/* Reply Avatar */}
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

                                          {/* Reply Actions */}
                                          <div className={styles.replyActions}>
                                            <button 
                                              onClick={() => setActiveNestedReply(prev => ({ ...prev, [`${comment._id}-${reply._id}`]: !prev[`${comment._id}-${reply._id}`] }))}
                                              className={styles.nestedReplyBtn}
                                            >
                                              Reply {nestedReplies.length > 0 && `(${nestedReplies.length})`}
                                            </button>
                                          </div>

                                          {/* ===== NESTED REPLIES (Level 2) ===== */}
                                          {visibleNestedReplies.map((nestedReply) => (
                                            <div key={nestedReply._id} className={styles.nestedReplyContainer}>
                                              <div className={styles.nestedReplyWrapper}>
                                                <CornerDownRight size={12} className={styles.nestedReplyIcon} />
                                                <div className={styles.nestedReplyBubble}>
                                                  <div className={styles.nestedReplyInner}>
                                                    {/* Nested Reply Avatar */}
                                                    <div className={styles.nestedReplyAvatar}>
                                                      {nestedReply.user?.avatar ? (
                                                        <img src={nestedReply.user.avatar} alt="" />
                                                      ) : (
                                                        <div className={styles.nestedReplyAvatarFallback}>
                                                          {nestedReply.user?.name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className={styles.nestedReplyContent}>
                                                      <div className={styles.nestedReplyMeta}>
                                                        <h5 className={styles.nestedReplyUserName}>{nestedReply.user?.name}</h5>
                                                        <span className={styles.nestedReplyDate}>
                                                          {new Date(nestedReply.createdAt).toLocaleDateString()}
                                                        </span>
                                                      </div>
                                                      <p className={styles.nestedReplyText}>{nestedReply.text}</p>
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
                                              className={styles.nestedSeeMoreBtn}
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
                                            <div className={styles.nestedReplyInputWrapper}>
                                              <input 
                                                type="text" 
                                                placeholder="Write a reply..."
                                                value={nestedReplyInputs[`${post._id}-${comment._id}-${reply._id}`] || ''}
                                                onChange={(e) => setNestedReplyInputs(prev => ({ ...prev, [`${post._id}-${comment._id}-${reply._id}`]: e.target.value }))}
                                                className={styles.nestedReplyInput}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleNestedReply(post._id, comment._id, reply._id); }} 
                                              />
                                              <button 
                                                onClick={() => handleNestedReply(post._id, comment._id, reply._id)}
                                                className={styles.sendNestedReplyBtn}
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
                                    className={styles.seeMoreBtn}
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
};

export default Feed;