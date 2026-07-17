import express from 'express';
import {
  createPost,
  getAllPosts,
  likePost,
  commentPost,
  deletePost
} from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllPosts)
  .post(protect, upload.single('postImage'), createPost);

router.route('/:postId')
  .delete(protect, deletePost);

router.route('/:postId/like')
  .put(protect, likePost);

router.route('/:postId/comment')
  .post(protect, commentPost);

export default router;
