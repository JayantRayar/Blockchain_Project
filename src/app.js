const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerDocs = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customSiteTitle: 'Bitcoin Monitoring System API Docs'
}));

// Root welcome & info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Blockchain-Based Bitcoin Monitoring System API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health',
    status: 'Running'
  });
});

// Mount API routes
app.use('/api', routes);

// 404 Not Found Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
