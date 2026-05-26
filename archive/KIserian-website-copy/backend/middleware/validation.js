const { body, validationResult, param } = require('express-validator');
const logger = require('../config/logging');

/**
 * Validation middleware to check for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      url: req.url,
      method: req.method,
      errors: errors.array()
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // User validation
  user: {
    create: [
      body('username').trim().notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
      body('email').trim().notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Valid email is required')
        .normalizeEmail(),
      body('password').notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      body('first_name').trim().notEmpty().withMessage('First name is required')
        .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters'),
      body('last_name').trim().notEmpty().withMessage('Last name is required')
        .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters'),
      body('phone_number').optional()
        .isMobilePhone('any').withMessage('Valid phone number is required')
    ],
    update: [
      body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty')
        .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters'),
      body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty')
        .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters'),
      body('phone_number').optional()
        .isMobilePhone('any').withMessage('Valid phone number is required'),
      body('email').optional().isEmail().withMessage('Valid email is required')
        .normalizeEmail()
    ],
    changePassword: [
      body('current_password').notEmpty().withMessage('Current password is required'),
      body('new_password').notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    ]
  },

  // Announcement validation
  announcement: {
    create: [
      body('title').trim().notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
      body('content').trim().notEmpty().withMessage('Content is required')
        .isLength({ max: 10000 }).withMessage('Content must not exceed 10000 characters'),
      body('announcement_type').optional()
        .isIn(['general', 'department', 'emergency']).withMessage('Invalid announcement type'),
      body('priority').optional()
        .isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority level'),
      body('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
      body('department_id').optional().isUUID().withMessage('Invalid department ID')
    ],
    update: [
      body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
        .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
      body('content').optional().trim().notEmpty().withMessage('Content cannot be empty')
        .isLength({ max: 10000 }).withMessage('Content must not exceed 10000 characters'),
      body('announcement_type').optional()
        .isIn(['general', 'department', 'emergency']).withMessage('Invalid announcement type'),
      body('priority').optional()
        .isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority level'),
      body('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
      body('department_id').optional().isUUID().withMessage('Invalid department ID')
    ]
  },

  // Department validation
  department: {
    create: [
      body('name').trim().notEmpty().withMessage('Department name is required')
        .isLength({ max: 100 }).withMessage('Department name must not exceed 100 characters'),
      body('description').optional().trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
      body('head_id').optional().isUUID().withMessage('Invalid head ID'),
      body('category').optional().trim()
        .isLength({ max: 50 }).withMessage('Category must not exceed 50 characters')
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty')
        .isLength({ max: 100 }).withMessage('Department name must not exceed 100 characters'),
      body('description').optional().trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
      body('head_id').optional().isUUID().withMessage('Invalid head ID'),
      body('category').optional().trim()
        .isLength({ max: 50 }).withMessage('Category must not exceed 50 characters')
    ],
    addMember: [
      body('user_id').isUUID().withMessage('Valid user ID is required'),
      body('role_in_department').optional().trim()
        .isLength({ max: 50 }).withMessage('Role must not exceed 50 characters')
    ]
  },

  // Payment validation
  payment: {
    create: [
      body('phone_number').isMobilePhone('any').withMessage('Valid phone number is required'),
      body('payment_items').isArray({ min: 1 }).withMessage('At least one payment item is required'),
      body('payment_items.*.category_id').isUUID().withMessage('Valid category ID is required'),
      body('payment_items.*.amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
      body('notes').optional().isString().withMessage('Notes must be a string')
        .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
    ]
  },

  // Event validation
  event: {
    create: [
      body('title').trim().notEmpty().withMessage('Event title is required')
        .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
      body('description').optional().trim()
        .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
      body('event_date').isISO8601().withMessage('Valid event date is required'),
      body('event_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time format (use HH:MM)'),
      body('location').optional().trim()
        .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
      body('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
      body('max_attendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive integer')
    ],
    update: [
      body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
        .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
      body('description').optional().trim()
        .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
      body('event_date').optional().isISO8601().withMessage('Valid event date is required'),
      body('event_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time format (use HH:MM)'),
      body('location').optional().trim()
        .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
      body('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
      body('max_attendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive integer')
    ]
  },

  // SMS validation
  sms: {
    send: [
      body('phone_numbers').isArray({ min: 1 }).withMessage('At least one phone number is required'),
      body('phone_numbers.*').isMobilePhone('any').withMessage('Invalid phone number format'),
      body('message').trim().notEmpty().withMessage('Message is required')
        .isLength({ min: 1, max: 160 }).withMessage('Message must be 1-160 characters')
    ],
    bulkSend: [
      body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
      body('message').trim().notEmpty().withMessage('Message is required')
        .isLength({ min: 1, max: 160 }).withMessage('Message must be 1-160 characters')
    ]
  },

  // ID parameter validation
  idParam: [
    param('id').isUUID().withMessage('Valid ID is required')
  ],

  // Department ID parameter validation
  departmentIdParam: [
    param('departmentId').isUUID().withMessage('Valid department ID is required')
  ]
};

module.exports = {
  validate,
  validationRules
};
