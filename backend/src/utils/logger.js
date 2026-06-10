/**
 * Logger Utility
 * Simple logging utility for the application
 */

const logger = {
  info: (context, action, data = {}) => {
    console.log(`[INFO] ${context} - ${action}`, data);
  },
  error: (context, action, data = {}) => {
    console.error(`[ERROR] ${context} - ${action}`, data);
  },
  warn: (context, action, data = {}) => {
    console.warn(`[WARN] ${context} - ${action}`, data);
  },
  debug: (context, action, data = {}) => {
    console.debug(`[DEBUG] ${context} - ${action}`, data);
  },
};

module.exports = logger;
