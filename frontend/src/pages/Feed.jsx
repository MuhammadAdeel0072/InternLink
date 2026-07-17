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
  Calendar,
  X
} from 'lucide-react';

const Feed = () => {
  const { user } = useAuth();
  const { emitNotificationAlert } = useSocket();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  // Post creation state
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef();

  // Comments state (map of postId -> commentText)
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({}); // map of postId -> boolean

  const limit = 5;

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

  // Post image change handler
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

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImage) return;

    setPosting(true);
    const formData = new FormData();
    formData.append('content', newPostText);
    if (newPostImage) {
      formData.append('postImage', newPostImage);
    }

    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Add to top of feed
      setPosts((prev) => [res.data, ...prev]);
      setNewPostText('');
      clearImageSelection();
    } catch (err) {
      alert('Post creation failed.');
    } finally {
      setPosting(false);
    }
  };

  // Toggle Like optimistically
  const handleLike = async (postId) => {
    try {
      // Find post and update UI immediately
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
      // Update with exact server data
      updatedPostsList[postIndex] = res.data;
      setPosts([...updatedPostsList]);

      // Emit notifications if liked (not unliked) and not self-action
      if (!hasLiked && res.data.author._id !== user._id) {
        emitNotificationAlert(res.data.author._id, {
          type: 'like',
          content: `${user.name} liked your post.`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post comment handler
  const handlePostComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      
      // Update specific post in state list
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

      // Emit socket notification
      if (res.data.author._id !== user._id) {
        emitNotificationAlert(res.data.author._id, {
          type: 'comment',
          content: `${user.name} commented on your post.`
        });
      }
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const handleCommentInputChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const toggleCommentsExpansion = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      await api.delete(`/posts/${postId}`);
    } catch (err) {
      alert('Failed to delete post.');
      fetchPosts(true);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Create Post Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <form onSubmit={handleCreatePost}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <textarea
              placeholder="What project are you working on? Ask the community..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                resize: 'none',
                height: '60px',
                fontSize: '0.95rem',
                outline: 'none',
                paddingTop: '8px'
              }}
            />
          </div>

          {imagePreview && (
            <div style={{ position: 'relative', marginTop: '12px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '200px' }}>
              <img src={imagePreview} alt="preview" style={{ width: '100%', objectFit: 'cover' }} />
              <button
                onClick={clearImageSelection}
                type="button"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '4px'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              <ImageIcon size={18} style={{ color: 'var(--primary)' }} />
              Add Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={posting || (!newPostText.trim() && !newPostImage)}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed Timeline */}
      {loading && posts.length === 0 ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <div key={post._id} className="card" style={{ marginBottom: '20px', padding: '20px' }}>
              
              {/* Post Header */}
              <div style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    onClick={() => (window.location.href = `/profile/${post.author._id}`)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-tertiary)',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                  >
                    {post.author.avatar ? (
                      <img src={post.author.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4
                      onClick={() => (window.location.href = `/profile/${post.author._id}`)}
                      style={{ fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {post.author.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {post.author.headline || 'Student / Job Seeker'} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {post.author._id === user._id && (
                  <button onClick={() => handleDeletePost(post._id)} style={{ color: 'var(--text-muted)', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Post Content */}
              <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', marginBottom: '14px' }}>
                {post.content}
              </p>

              {post.image && (
                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '14px', maxHeight: '350px', border: '1px solid var(--border-color)' }}>
                  <img src={post.image} alt="post media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}

              {/* Action Counters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '10px' }}>
                <span>{post.likes?.length || 0} Likes</span>
                <span onClick={() => toggleCommentsExpansion(post._id)} style={{ cursor: 'pointer' }}>
                  {post.comments?.length || 0} Comments
                </span>
              </div>

              {/* Action triggers */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                <button
                  onClick={() => handleLike(post._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: post.likes?.includes(user._id) ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: post.likes?.includes(user._id) ? 600 : 500
                  }}
                >
                  <ThumbsUp size={16} /> Like
                </button>
                <button
                  onClick={() => toggleCommentsExpansion(post._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <MessageCircle size={16} /> Comment
                </button>
              </div>

              {/* Expandable Comments Section */}
              {expandedComments[post._id] && (
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {/* Create Comment Input */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post._id] || ''}
                      onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePostComment(post._id);
                      }}
                    />
                    <button
                      onClick={() => handlePostComment(post._id)}
                      disabled={!commentInputs[post._id]?.trim()}
                      style={{
                        padding: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex'
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>

                  {/* Comments list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map((comment) => (
                        <div key={comment._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                            {comment.user.avatar ? (
                              <img src={comment.user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                                {comment.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <h5 style={{ fontSize: '0.8rem', fontWeight: 600 }}>{comment.user.name}</h5>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No comments yet.</p>
                    )}
                  </div>

                </div>
              )}

            </div>
          ))}

          {/* Load More trigger */}
          {hasMore && (
            <button
              onClick={() => fetchPosts(false)}
              className="btn btn-secondary"
              disabled={loadingMore}
              style={{ width: '100%', padding: '10px' }}
            >
              {loadingMore ? 'Loading...' : 'Load More Posts'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <p>No posts in your feed yet. Share your first project or connect with peers!</p>
        </div>
      )}

    </div>
  );
};

export default Feed;
