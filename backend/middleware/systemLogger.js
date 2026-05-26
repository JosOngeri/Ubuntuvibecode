const SystemLog = require('../models/SystemLog.model');

// Middleware to log system events
const systemLogger = (level = 'info') => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to capture response
    res.json = function(data) {
      // Log the response
      logSystemEvent(req, res, data, level).catch(err => {
        console.error('Failed to log system event:', err);
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Function to log system events
async function logSystemEvent(req, res, responseData, level) {
  try {
    // Determine log level based on status code
    let logLevel = level;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = 'warning';
    } else if (res.statusCode >= 500) {
      logLevel = 'error';
    }

    // Extract module and action from route
    const pathParts = req.path.split('/').filter(Boolean);
    const module = pathParts[1] || 'unknown';
    const action = `${req.method} ${pathParts.slice(2).join('/')}` || 'unknown';

    // Get user info if available
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create metadata
    const metadata = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: res.responseTime,
      query: req.query,
      params: req.params
    };

    // Don't log sensitive data
    if (req.body && req.body.password) {
      metadata.body = { ...req.body, password: '[REDACTED]' };
    } else if (req.body) {
      metadata.body = req.body;
    }

    // For PUT/PATCH requests, try to capture old values from response data
    if ((req.method === 'PUT' || req.method === 'PATCH') && responseData) {
      if (responseData.old_value !== undefined) {
        metadata.old_value = responseData.old_value;
      }
      if (responseData.new_value !== undefined) {
        metadata.new_value = responseData.new_value;
      }
    }

    // Only log certain events to avoid overwhelming the database
    const shouldLog = shouldLogEvent(req, res, responseData);

    if (shouldLog) {
      await SystemLog.create({
        level: logLevel,
        message: `${req.method} ${req.path} - ${res.statusCode}`,
        module,
        action,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata
      });
    }
  } catch (error) {
    console.error('Error in system logger:', error);
  }
}

// Determine if event should be logged
function shouldLogEvent(req, res, responseData) {
  // Don't log health checks
  if (req.path === '/api/health') {
    return false;
  }

  // Always log authentication events
  if (req.path.includes('/auth/')) {
    return true;
  }

  // Always log settings changes
  if (req.path.includes('/settings/')) {
    return true;
  }

  // Always log employee operations
  if (req.path.includes('/employees/')) {
    return true;
  }

  // Always log user operations
  if (req.path.includes('/users/')) {
    return true;
  }

  // Log all POST, PUT, PATCH, DELETE requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return true;
  }

  // Don't log other GET requests for performance
  return false;
}

// Helper function to manually log custom events
exports.logEvent = async (level, message, module, action, userId, metadata = {}) => {
  try {
    await SystemLog.create({
      level,
      message,
      module,
      action,
      user_id: userId,
      metadata
    });
  } catch (error) {
    console.error('Error logging custom event:', error);
  }
};

// Helper function to log errors
exports.logError = async (error, module, action, userId, metadata = {}) => {
  try {
    await SystemLog.create({
      level: 'error',
      message: error.message || 'Unknown error',
      module,
      action,
      user_id: userId,
      metadata: {
        ...metadata,
        stack: error.stack,
        name: error.name
      }
    });
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
};

module.exports = systemLogger;
