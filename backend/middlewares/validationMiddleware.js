import { body, param, query, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  console.log(`[VALIDATE] ${req.method} ${req.originalUrl} - checking validation result`);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(`[VALIDATE] ${req.method} ${req.originalUrl} - validation failed:`, errors.array().map(e => e.msg).join(', '));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  console.log(`[VALIDATE] ${req.method} ${req.originalUrl} - validation passed, calling next()`);
  next();
};

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .escape(),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('role')
    .optional()
    .isIn(['student', 'recruiter']).withMessage('Role must be student or recruiter')
    .escape(),
  validateRequest
];

export const validateLogin = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateRequest
];

export const validatePasswordReset = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).withMessage('Password must contain uppercase, lowercase, number, and special character'),
  validateRequest
];

export const validatePost = [
  body('content')
    .optional({ values: 'undefined' })
    .trim()
    .isLength({ max: 5000 }).withMessage('Post content cannot exceed 5000 characters'),
  validateRequest
];

export const validateComment = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
  validateRequest
];

export const validateJob = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 200 }).withMessage('Job title cannot exceed 200 characters'),
  body('company')
    .trim()
    .notEmpty().withMessage('Company name is required'),
  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required'),
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required'),
  body('jobType')
    .optional()
    .isIn(['Internship', 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary']).withMessage('Invalid job type'),
  validateRequest
];

export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage('Invalid ID format'),
  validateRequest
];
