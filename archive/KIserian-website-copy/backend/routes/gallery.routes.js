const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getPhotos,
  uploadPhoto,
  deletePhoto,
  searchPhotos,
  getCategories,
  syncPhotos
} = require('../controllers/gallery.controller');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for memory storage (for uploading to Telegram)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (Telegram's limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/photos', getPhotos);
router.get('/search', searchPhotos);
router.get('/categories', getCategories);

// Protected routes (require authentication)
router.post('/upload', authenticateToken, upload.single('photo'), uploadPhoto);
router.delete('/photos/:id', authenticateToken, deletePhoto);
router.post('/sync', authenticateToken, syncPhotos);

module.exports = router;
