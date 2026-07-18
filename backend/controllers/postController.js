import Post from '../models/Post.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Helper to populate user details including profile avatar
const populateAuthorDetails = async (posts) => {
  return await Promise.all(
    posts.map(async (post) => {
      const authorProfile = await Profile.findOne({ user: post.author }).select('avatar headline');
     const commentsWithProfiles = await Promise.all(
  post.comments.map(async (comment) => {
    const commentProfile = await Profile.findOne({ user: comment.user }).select('avatar');
    const repliesWithProfiles = await Promise.all(
      (comment.replies || []).map(async (reply) => {
        const replyProfile = await Profile.findOne({ user: reply.user }).select('avatar');
        return {
          _id: reply._id,
          text: reply.text,
          createdAt: reply.createdAt,
          user: {
            _id: reply.user._id,
            name: reply.user.name,
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
        _id: comment.user._id,
        name: comment.user.name,
        avatar: commentProfile?.avatar || ''
      }
    };
  })
);
        

      return {
        _id: post._id,
        content: post.content,
        image: post.image,
        likes: post.likes,
        comments: commentsWithProfiles,
        createdAt: post.createdAt,
        author: {
          _id: post.author._id,
          name: post.author.name,
          email: post.author.email,
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
    const { content } = req.body;
    let imageUrl = '';

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Post content or image is required' });
    }

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    const post = await Post.create({
      author: req.user._id,
      content: content || '',
      image: imageUrl,
      likes: [],
      comments: []
    });

    const populatedArray = await populateAuthorDetails([post]);
    res.status(201).json(populatedArray[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      .populate('comments.user', 'name');

    const formattedPosts = await populateAuthorDetails(posts);
    res.status(200).json(formattedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like or unlike a post
// @route   PUT /api/posts/:postId/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike post
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      // Like post
      post.likes.push(req.user._id);

      // Create notification for the post author (only if they aren't the liker)
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          content: `${req.user.name} liked your post.`,
          link: '/feed'
        });
      }
    }

    await post.save();
    
    // Fetch updated post with layout details
    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');
      
    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json(formatted[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:postId/comment
// @access  Private
export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      user: req.user._id,
      text
    };

    post.comments.push(newComment);
    await post.save();

    // Create Notification (only if they aren't the author)
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        content: `${req.user.name} commented: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        link: '/feed'
      });
    }

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name');
      
    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json(formatted[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:postId
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Reply to a comment
// @route   POST /api/posts/:postId/comments/:commentId/reply
// @access  Private
export const replyToComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Reply text is required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.replies.push({ user: req.user._id, text });
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');
      
    const formatted = await populateAuthorDetails([updatedPost]);
    res.status(200).json(formatted[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};