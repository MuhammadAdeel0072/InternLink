import Post from '../models/Post.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

/**
 * Batch-enriches posts with author/comment/reply profile and user data.
 *
 * Instead of issuing a separate DB query for every post, comment, and reply
 * (the old N+1 pattern), this function:
 *   1. Collects all unique user IDs in a single pass through the post tree.
 *   2. Fetches all User documents in ONE query (User.find with $in).
 *   3. Fetches all Profile documents in ONE query (Profile.find with $in).
 *   4. Maps the data back into the response objects in memory.
 *
 * Result: 3 queries total regardless of how many posts/comments/replies exist.
 */
const populateAuthorDetails = async (posts) => {
  // --- Step 1: Collect all unique user IDs ---
  const userIds = new Set();
  const profileUserIds = new Set(); // Track which user IDs need profile lookups

  posts.forEach((post) => {
    const authorId = post.author?._id || post.author;
    if (authorId) {
      const idStr = authorId.toString();
      profileUserIds.add(authorId);
      userIds.add(idStr);
    }

    (post.comments || []).forEach((comment) => {
      const commentUserId = comment.user?._id || comment.user;
      if (commentUserId) {
        const idStr = commentUserId.toString();
        profileUserIds.add(commentUserId);
        userIds.add(idStr);
      }

      (comment.replies || []).forEach((reply) => {
        const replyUserId = reply.user?._id || reply.user;
        if (replyUserId) {
          const idStr = replyUserId.toString();
          profileUserIds.add(replyUserId);
          userIds.add(idStr);
        }
      });
    });
  });

  if (userIds.size === 0) {
    // No users to look up — return plain posts
    return posts.map((post) => formatPost(post, {}, {}));
  }

  // --- Step 2: Batch fetch all users in ONE query ---
  const users = await User.find({ _id: { $in: [...userIds] } })
    .select('name email avatar')
    .lean();
  const userMap = new Map();
  users.forEach((u) => userMap.set(u._id.toString(), u));

  // --- Step 3: Batch fetch all profiles in ONE query ---
  const profiles = await Profile.find({ user: { $in: [...profileUserIds] } })
    .select('user avatar headline')
    .lean();
  const profileMap = new Map();
  profiles.forEach((p) => {
    if (p.user) profileMap.set(p.user.toString(), p);
  });

  // --- Step 4: Map data back into posts in memory ---
  return posts.map((post) => formatPost(post, userMap, profileMap));
};

/**
 * Formats a single post with enriched author, comment, and reply data
 * from the pre-fetched userMap and profileMap.
 */
const formatPost = (post, userMap, profileMap) => {
  const authorId = post.author?._id || post.author;
  const authorIdStr = authorId ? authorId.toString() : null;

  // Author enrichment
  const authorUser = post.author && typeof post.author === 'object' ? post.author : userMap.get(authorIdStr);
  const authorProfile = profileMap.get(authorIdStr);
  const authorName = authorUser?.name || 'User';
  const authorEmail = authorUser?.email || '';

  // Comments enrichment
  const commentsWithProfiles = (post.comments || []).map((comment) => {
    const commentUserId = comment.user?._id || comment.user;
    const commentUserIdStr = commentUserId ? commentUserId.toString() : null;
    const commentUser = comment.user && typeof comment.user === 'object' ? comment.user : userMap.get(commentUserIdStr);
    const commentProfile = profileMap.get(commentUserIdStr);

    // Replies enrichment
    const repliesWithProfiles = (comment.replies || []).map((reply) => {
      const replyUserId = reply.user?._id || reply.user;
      const replyUserIdStr = replyUserId ? replyUserId.toString() : null;
      const replyUser = reply.user && typeof reply.user === 'object' ? reply.user : userMap.get(replyUserIdStr);
      const replyProfile = profileMap.get(replyUserIdStr);

      return {
        _id: reply._id,
        text: reply.text,
        createdAt: reply.createdAt,
        user: {
          _id: replyUserId || null,
          name: replyUser?.name || 'User',
          avatar: replyProfile?.avatar || ''
        }
      };
    });

    return {
      _id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
      replies: repliesWithProfiles,
      user: {
        _id: commentUserId || null,
        name: commentUser?.name || 'User',
        avatar: commentProfile?.avatar || ''
      }
    };
  });

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
      _id: authorIdStr || null,
      name: authorName,
      email: authorEmail,
      avatar: authorProfile?.avatar || '',
      headline: authorProfile?.headline || ''
    }
  };
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
  const startTime = Date.now();
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const skip = parseInt(req.query.skip) || 0;

    const dbStart = Date.now();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const dbEnd = Date.now();
    const populateStart = Date.now();

    const formattedPosts = await populateAuthorDetails(posts);

    const populateEnd = Date.now();
    const totalTime = Date.now() - startTime;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[POST_CONTROLLER] getAllPosts - Total: ${totalTime}ms | DB: ${dbEnd - dbStart}ms | Populate: ${populateEnd - populateStart}ms | Posts: ${formattedPosts.length}`);
    }

    res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: { skip, limit, returned: formattedPosts.length, hasMore: formattedPosts.length === limit }
    });
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

    const updatedPost = await Post.findById(post._id).lean();

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] likePost - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Comment on a post
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

    const updatedPost = await Post.findById(post._id).lean();

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

    const updatedPost = await Post.findById(post._id).lean();

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

    const updatedPost = await Post.findById(post._id).lean();

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

    const updatedPost = await Post.findById(post._id).lean();

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

    const updatedPost = await Post.findById(post._id).lean();

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

    const updatedPost = await Post.findById(post._id).lean();

    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json({ success: true, data: formatted[0] });
  } catch (error) {
    console.error('[POST_CONTROLLER] deleteReply - error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};