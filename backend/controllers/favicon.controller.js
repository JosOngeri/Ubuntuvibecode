const Favicon = require('../models/Favicon.model');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db').pool;
const logger = require('../utils/logger');

const FAVICON_TABLE = 'favicons';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/favicons');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Get current active favicon
exports.getActiveFavicon = async (req, res) => {
  try {
    let favicon;
    try {
      favicon = await Favicon.findOne({ where: { isActive: true } });
    } catch (modelError) {
      logger.warn('favicon.getActive', 'Favicon model not initialized, using default');
    }
    
    if (!favicon) {
      // Return default favicon info
      return res.json({
        id: 1,
        svg_content: '',
        is_active: true,
        uploaded_by: null,
        uploaded_at: new Date().toISOString()
      });
    }
    
    res.json(favicon);
  } catch (error) {
    logger.error('favicon.getActive', 'Error fetching favicon', error);
    res.json({
      id: 1,
      svg_content: '',
      is_active: true,
      uploaded_by: null,
      uploaded_at: new Date().toISOString()
    });
  }
};

// Get all favicons
exports.getAllFavicons = async (req, res) => {
  try {
    const favicons = await Favicon.findAll({
      order: [['uploaded_at', 'DESC']]
    });
    res.json(favicons);
  } catch (error) {
    logger.error('favicon.getAll', 'Error fetching favicons', error);
    res.status(500).json({ error: 'Failed to fetch favicons' });
  }
};

// Upload custom favicon
exports.uploadFavicon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete uploaded file if invalid type
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid file type. Only PNG and ICO files are allowed.' });
    }

    // Validate file size (max 1MB)
    if (req.file.size > 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File size too large. Maximum 1MB allowed.' });
    }

    // Deactivate all existing favicons
    await Favicon.update({ isActive: false }, { where: {} });

    // Create new favicon record
    const favicon = await Favicon.create({
      type: 'custom',
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/favicons/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      isActive: true,
      uploadedBy: req.user?.id
    });

    res.json(favicon);
  } catch (error) {
    logger.error('favicon.upload', 'Error uploading favicon', error);
    res.status(500).json({ error: 'Failed to upload favicon' });
  }
};

// Set default favicon
exports.setDefaultFavicon = async (req, res) => {
  try {
    const { variant } = req.body; // '1' or '2'
    
    if (!variant || !['1', '2'].includes(variant)) {
      return res.status(400).json({ error: 'Invalid variant. Must be 1 or 2.' });
    }

    // Deactivate all existing favicons
    await Favicon.update({ isActive: false }, { where: {} });

    // Create or update default favicon record
    const existingDefault = await Favicon.findOne({ where: { type: 'default' } });
    
    if (existingDefault) {
      const updated = await Favicon.update({
        filename: `favicon-${variant}.png`,
        path: `/favicon-${variant}.png`,
        isActive: true
      }, { where: { id: existingDefault.id } });
      res.json(updated);
    } else {
      const favicon = await Favicon.create({
        type: 'default',
        filename: `favicon-${variant}.png`,
        path: `/favicon-${variant}.png`,
        isActive: true
      });
      res.json(favicon);
    }
  } catch (error) {
    logger.error('favicon.setDefault', 'Error setting default favicon', error);
    res.status(500).json({ error: 'Failed to set default favicon' });
  }
};

// Delete favicon
exports.deleteFavicon = async (req, res) => {
  try {
    const { id } = req.params;
    
    const favicon = await Favicon.findByPk(id);
    if (!favicon) {
      return res.status(404).json({ error: 'Favicon not found' });
    }

    // If deleting active favicon, don't allow
    if (favicon.is_active) {
      return res.status(400).json({ error: 'Cannot delete active favicon. Set another favicon as active first.' });
    }

    // Delete file from filesystem if it's a custom upload
    if (favicon.type === 'custom' && favicon.filename) {
      const filePath = path.join(__dirname, '../uploads/favicons', favicon.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query(`DELETE FROM ${FAVICON_TABLE} WHERE id = $1`, [id]);
    res.json({ message: 'Favicon deleted successfully' });
  } catch (error) {
    logger.error('favicon.delete', 'Error deleting favicon', error, { id: req.params.id });
    res.status(500).json({ error: 'Failed to delete favicon' });
  }
};

// Set active favicon
exports.setActiveFavicon = async (req, res) => {
  try {
    const { id } = req.params;
    
    const favicon = await Favicon.findByPk(id);
    if (!favicon) {
      return res.status(404).json({ error: 'Favicon not found' });
    }

    // Deactivate all favicons
    await pool.query(`UPDATE ${FAVICON_TABLE} SET is_active = FALSE`);

    // Activate selected favicon
    await pool.query(`UPDATE ${FAVICON_TABLE} SET is_active = TRUE WHERE id = $1`, [id]);

    const updated = await Favicon.findByPk(id);
    res.json(updated);
  } catch (error) {
    logger.error('favicon.setActive', 'Error setting active favicon', error, { id: req.params.id });
    res.status(500).json({ error: 'Failed to set active favicon' });
  }
};
