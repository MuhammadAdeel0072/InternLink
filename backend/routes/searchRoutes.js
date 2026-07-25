import express from 'express';
import Job from '../models/Job.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ people: [], jobs: [], posts: [] });

    const results = {};

    // Search People
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('name email role').limit(5);

    results.people = await Promise.all(users.map(async (u) => {
      const profile = await Profile.findOne({ user: u._id }).select('avatar headline university');
      return {
        _id: u._id, name: u.name, role: u.role,
        avatar: profile?.avatar || '', headline: profile?.headline || '',
        university: profile?.university || ''
      };
    }));

    // Search Jobs
    results.jobs = await Job.find({
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { skills: { $regex: q, $options: 'i' } }
      ]
    }).select('title company location jobType salaryRange').limit(5);

    // Search Posts
    const posts = await Post.find({
      content: { $regex: q, $options: 'i' }
    }).populate('author', 'name').limit(5).sort({ createdAt: -1 });

    results.posts = posts.map(p => ({
      _id: p._id,
      content: p.content?.substring(0, 100),
      author: p.author?.name,
      createdAt: p.createdAt,
      likes: p.likes?.length || 0,
      comments: p.comments?.length || 0
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;