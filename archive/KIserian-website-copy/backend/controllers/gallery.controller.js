const { pool } = require('../config/database');
const axios = require('axios');

// Telegram Bot API configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@sdakiserianmain';

/**
 * Sync existing photos from Telegram channel to database
 */
const syncPhotos = async (req, res) => {
  try {
    let allPhotos = [];
    let offset = 0;
    let hasMore = true;

    // Fetch all messages from the channel
    while (hasMore) {
      try {
        const response = await axios.get(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatHistory`,
          {
            params: {
              chat_id: TELEGRAM_CHANNEL_ID,
              limit: 100,
              offset: offset
            }
          }
        );

        if (response.data.ok) {
          const messages = response.data.result || [];
          if (messages.length === 0) {
            hasMore = false;
          } else {
            allPhotos = allPhotos.concat(messages);
            offset += messages.length;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        // If getChatHistory is not available, try getUpdates
        console.log('getChatHistory not available, trying alternative method');
        break;
      }
    }

    // Alternative method: Use getUpdates if getChatHistory fails
    if (allPhotos.length === 0) {
      try {
        const response = await axios.get(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`,
          {
            params: {
              offset: -100,
              limit: 100
            }
          }
        );

        if (response.data.ok) {
          allPhotos = response.data.result || [];
        }
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      }
    }

    // Filter messages that contain photos
    const photoMessages = allPhotos.filter(msg => msg.photo && msg.photo.length > 0);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const message of photoMessages) {
      const fileId = message.photo[message.photo.length - 1].file_id;
      const caption = message.caption || '';
      
      // Check if photo already exists
      const existing = await pool.query(
        'SELECT id FROM gallery_photos WHERE telegram_message_id = $1',
        [message.message_id]
      );

      if (existing.rows.length === 0) {
        // Insert new photo
        await pool.query(
          `INSERT INTO gallery_photos (telegram_message_id, telegram_file_id, caption, uploaded_at)
           VALUES ($1, $2, $3, NOW())`,
          [message.message_id, fileId, caption]
        );
        syncedCount++;
      } else {
        skippedCount++;
      }
    }

    res.json({
      message: 'Photos synced successfully',
      synced: syncedCount,
      skipped: skippedCount,
      total: photoMessages.length
    });
  } catch (error) {
    console.error('Error syncing photos:', error);
    res.status(500).json({ error: 'Failed to sync photos' });
  }
};

/**
 * Fetch photos from Telegram channel
 */
const getPhotos = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT gp.*, u.first_name, u.last_name, u.username
      FROM gallery_photos gp
      LEFT JOIN users u ON gp.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Add category filter
    if (category) {
      query += ` AND gp.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Add search filter
    if (search) {
      query += ` AND (to_tsvector('english', gp.caption || ' ' || COALESCE(gp.description, '')) @@ plainto_tsquery('english', $${paramCount}))`;
      params.push(search);
      paramCount++;
    }

    query += ` ORDER BY gp.uploaded_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM gallery_photos WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (category) {
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (to_tsvector('english', caption || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $${countParamCount}))`;
      countParams.push(search);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      photos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
};

/**
 * Upload photo to Telegram channel
 */
const uploadPhoto = async (req, res) => {
  try {
    const { caption, description, category } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Telegram via Bot API
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHANNEL_ID);
    formData.append('photo', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('caption', caption || '');

    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (!telegramResponse.data.ok) {
      throw new Error(telegramResponse.data.description || 'Telegram API error');
    }

    const message = telegramResponse.data.result;
    const fileId = message.photo[message.photo.length - 1].file_id;

    // Store metadata in database
    const insertResult = await pool.query(
      `INSERT INTO gallery_photos (telegram_message_id, telegram_file_id, caption, description, category, uploaded_by, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [message.message_id, fileId, caption, description, category, userId]
    );

    res.status(201).json({
      photo: insertResult.rows[0],
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

/**
 * Delete photo from Telegram channel
 */
const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Get photo from database
    const photoResult = await pool.query(
      'SELECT * FROM gallery_photos WHERE id = $1',
      [id]
    );

    if (photoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoResult.rows[0];

    // Check permission: admin can delete any, others can only delete their own
    if (!userRoles.includes('Super Admin') && photo.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete from Telegram
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
      {
        chat_id: TELEGRAM_CHANNEL_ID,
        message_id: photo.telegram_message_id
      }
    );

    // Delete from database
    await pool.query('DELETE FROM gallery_photos WHERE id = $1', [id]);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

/**
 * Search photos
 */
const searchPhotos = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT gp.*, u.first_name, u.last_name, u.username
      FROM gallery_photos gp
      LEFT JOIN users u ON gp.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (q) {
      query += ` AND (to_tsvector('english', gp.caption || ' ' || COALESCE(gp.description, '')) @@ plainto_tsquery('english', $${paramCount}))`;
      params.push(q);
      paramCount++;
    }

    if (category) {
      query += ` AND gp.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ` ORDER BY gp.uploaded_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ photos: result.rows });
  } catch (error) {
    console.error('Error searching photos:', error);
    res.status(500).json({ error: 'Failed to search photos' });
  }
};

/**
 * Get categories
 */
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM gallery_photos WHERE category IS NOT NULL ORDER BY category'
    );

    res.json({ categories: result.rows.map(row => row.category) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

module.exports = {
  getPhotos,
  uploadPhoto,
  deletePhoto,
  searchPhotos,
  getCategories,
  syncPhotos
};
