import Post from '../models/Post.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Helper to populate user details including profile avatar
const populateAuthorDetails = async (posts) => {
  return await Promise.all(
    posts.map(async (post) => {
      const authorId = post.author?._id || post.author;
      let authorProfile = null;
      let authorUser = null;

      if (authorId) {
        try {
          authorProfile = await Profile.findOne({ user: authorId }).select('avatar headline');
          authorUser = typeof post.author === 'object' && post.author !== null ? post.author : null;
          if (!authorUser) {
            authorUser = await User.findById(authorId).select('name email');
          }
        } catch (err) {
          console.error('[POST_CONTROLLER] populateAuthorDetails - error fetching author:', err.message);
        }
      }

      const commentsWithProfiles = await Promise.all(
        (post.comments || []).map(async (comment) => {
          const commentUserId = comment.user?._id || comment.user;
          let commentProfile = null;
          let commentUser = null;

          if (commentUserId) {
            try {
              commentProfile = await Profile.findOne({ user: commentUserId }).select('avatar');
              commentUser = typeof comment.user === 'object' && comment.user !== null ? comment.user : null;
              if (!commentUser) {
                commentUser = await User.findById(commentUserId).select('name');
              }
            } catch (err) {
              console.error('[POST_CONTROLLER] populateAuthorDetails - error fetching comment user:', err.message);
            }
          }

          const repliesWithProfiles = await Promise.all(
            (comment.replies || []).map(async (reply) => {
              const replyUserId = reply.user?._id || reply.user;
              let replyProfile = null;
              let replyUser = null;

              if (replyUserId) {
                try {
                  replyProfile = await Profile.findOne({ user: replyUserId }).select('avatar');
                  replyUser = typeof reply.user === 'object' && reply.user !== null ? reply.user : null;
                  if (!replyUser) {
                    replyUser = await User.findById(replyUserId).select('name');
                  }
                } catch (err) {
                  console.error('[POST_CONTROLLER] populateAuthorDetails - error fetching reply user:', err.message);
                }
              }

              return {
                _id: reply._id,
                text: reply.text,
                createdAt: reply.createdAt,
                user: {
                  _id: replyUserId,
                  name: replyUser?.name || 'User',
                  avatar: replyProfile?.avatar || ''
                }
              };
            })
          );

          return {
            _id: comment._id,
            text: comment.text,
            createdAt: comment.createdAt,
            replies: repliesWithProfiles,
            user: {
              _id: commentUserId,
              name: commentUser?.name || 'User',
              avatar: commentProfile?.avatar || ''
            }
          };
        })
      );

      return {
        _id: post._id,
        content: post.content || '',
        image: post.image || '',
        backgroundColor: post.backgroundColor || '',
        likes: post.likes || [],
        comments: commentsWithProfiles,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          _id: authorId || null,
          name: authorUser?.name || 'User',
          email: authorUser?.email || '',
          avatar: authorProfile?.avatar || '',
          headline: authorProfile?.headline || ''
        }
      };
    })
  );
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { content, backgroundColor } = req.body;
    let imageUrl = '';

    if (!content && !req.file) {
      return res.status(400).json({ success: false, message: 'Post content or image is required' });
    }

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    const post = await Post.create({
      author: req.user._id,
      content: content || '',
      image: imageUrl,
      backgroundColor: backgroundColor || '',
      likes: [],
      comments: []
    });

    const populatedArray = await populateAuthorDetails([post]);
    res.status(201).json({ success: true, data: populatedArray[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] createPost - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all posts (Timeline Feed)
// @route   GET /api/posts
// @access  Private
export const getAllPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');

    const formattedPosts = await populateAuthorDetails(posts);
    res.status(200).json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error('[POST_CONTROLLER] getAllPosts - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like or unlike a post
// @route   PUT /api/posts/:postId/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);

      if (post.author.toString() !== req.user._id.toString()) {
        await createNotification({
          recipientId: post.author,
          senderId: req.user._id,
          title: 'New Like',
          message: `${req.user.name} liked your post.`,
          type: 'like',
          category: 'post',
          entityId: post._id,
          entityType: 'post',
          io: req.io,
          userSocketMap: req.userSocketMap
        });
      }
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] likePost - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:postId/comment
// @access  Private
export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const newComment = {
      user: req.user._id,
      text
    };

    post.comments.push(newComment);
    await post.save();

    if (post.author.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId: post.author,
        senderId: req.user._id,
        title: 'New Comment',
        message: `${req.user.name} commented: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        type: 'comment',
        category: 'post',
        entityId: post._id,
        entityType: 'post',
        io: req.io,
        userSocketMap: req.userSocketMap
      });
    }

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] commentPost - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:postId
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[POST_CONTROLLER] deletePost - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Reply to a comment
// @route   POST /api/posts/:postId/comments/:commentId/reply
// @access  Private
export const replyToComment = async (req, res) => {
  try {
    const { text, isNestedReply, parentReplyId } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Reply text is required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (isNestedReply && parentReplyId) {
      return res.status(400).json({ success: false, message: 'Nested replies are no longer supported' });
    }

    comment.replies.push({ user: req.user._id, text });
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] replyToComment - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit a comment
// @route   PUT /api/posts/:postId/comments/:commentId
// @access  Private
export const editComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    comment.text = text;
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] editComment - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    post.comments.pull(req.params.commentId);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] deleteComment - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit a reply
// @route   PUT /api/posts/:postId/comments/:commentId/replies/:replyId
// @access  Private
export const editReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Reply text is required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to edit this reply' });
    }

    reply.text = text;
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] editReply - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a reply
// @route   DELETE /api/posts/:postId/comments/:commentId/replies/:replyId
// @access  Private
export const deleteReply = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this reply' });
    }

    comment.replies.pull(req.params.replyId);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] deleteReply - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};