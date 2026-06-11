/**
 * Swagger Middleware
 * Serves Swagger UI for API documentation
 */

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

/**
 * Swagger UI route handler
 */
const swaggerDocs = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerDocs,
};
