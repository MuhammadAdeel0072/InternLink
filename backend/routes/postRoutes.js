import express from 'express';

import {
  createPost,
  getAllPosts,
  likePost,
  commentPost,
  deletePost,
  replyToComment
} from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import { validatePost, validateComment, validateObjectId } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllPosts)
  .post(protect, upload.single('postImage'), validatePost, createPost);

router.route('/:postId')
  .delete(protect, validateObjectId, deletePost);

router.route('/:postId/like')
  .put(protect, validateObjectId, likePost);

router.route('/:postId/comment')
  .post(protect, validateObjectId, validateComment, commentPost);

router.route('/:postId/comments/:commentId/reply')
  .post(protect, validateObjectId, validateComment, replyToComment);

export default router;