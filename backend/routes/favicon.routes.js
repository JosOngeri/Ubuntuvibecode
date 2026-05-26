const express = require('express');
const router = express.Router();
const faviconController = require('../controllers/favicon.controller');
const multer = require('multer');
const path = require('path');

// Configure multer for favicon uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/favicons/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'favicon-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG and ICO files are allowed.'));
    }
  }
});

// Get current active favicon
router.get('/active', faviconController.getActiveFavicon);

// Get all favicons
router.get('/', faviconController.getAllFavicons);

// Upload custom favicon
router.post('/upload', upload.single('favicon'), faviconController.uploadFavicon);

// Set default favicon
router.post('/default', faviconController.setDefaultFavicon);

// Set active favicon
router.put('/:id/activate', faviconController.setActiveFavicon);

// Delete favicon
router.delete('/:id', faviconController.deleteFavicon);

module.exports = router;
