import express from 'express';

import {
  createPost,
  getAllPosts,
  likePost,
  commentPost,
  deletePost,
  replyToComment,
  editComment,
  deleteComment,
  editReply,
  deleteReply
} from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import { validatePost, validateComment, validateObjectId } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllPosts)
  .post(protect, upload.single('postImage'), validatePost, createPost);

router.route('/:postId')
  .delete(protect, validateObjectId('postId'), deletePost);

router.route('/:postId/like')
  .put(protect, validateObjectId('postId'), likePost);

router.route('/:postId/comment')
  .post(protect, validateObjectId('postId'), validateComment, commentPost);

router.route('/:postId/comments/:commentId')
  .put(protect, validateObjectId('postId'), validateObjectId('commentId'), validateComment, editComment)
  .delete(protect, validateObjectId('postId'), validateObjectId('commentId'), deleteComment);

router.route('/:postId/comments/:commentId/reply')
  .post(protect, validateObjectId('postId'), validateObjectId('commentId'), validateComment, replyToComment);

router.route('/:postId/comments/:commentId/replies/:replyId')
  .put(protect, validateObjectId('postId'), validateObjectId('commentId'), validateObjectId('replyId'), validateComment, editReply)
  .delete(protect, validateObjectId('postId'), validateObjectId('commentId'), validateObjectId('replyId'), deleteReply);

export default router;