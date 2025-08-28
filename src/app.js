/**
 * Enhanced LOS Application
 * Clean, efficient Express application setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/app');
const logger = require('./utils/logger');
const databaseService = require('./database/service');
const routes = require('./routes');

class EnhancedLOSApp {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSwagger();
        this.setupErrorHandling();
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false // Disable for Swagger UI
        }));

        // CORS
        this.app.use(cors({
            origin: config.security.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            preflightContinue: false,
            optionsSuccessStatus: 200
        }));

        // Compression
        if (config.features.enableCompression) {
            this.app.use(compression());
        }

        // Rate limiting - More flexible configuration for development
        if (config.features.enableRateLimiting) {
            // General API rate limiter (more lenient)
            const generalLimiter = rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // 1000 requests per 15 minutes
                message: {
                    success: false,
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    timestamp: new Date().toISOString()
                },
                standardHeaders: true,
                legacyHeaders: false
            });

            // Dashboard-specific rate limiter (very lenient for frontend)
            const dashboardLimiter = rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 2000, // 2000 requests per 15 minutes for dashboard
                message: {
                    success: false,
                    error: 'Too many requests',
                    message: 'Dashboard rate limit exceeded. Please try again later.',
                    timestamp: new Date().toISOString()
                },
                standardHeaders: true,
                legacyHeaders: false
            });

            // Apply rate limiting
            this.app.use('/api', generalLimiter);
            this.app.use('/api/dashboard', dashboardLimiter);
        }

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.headers['x-request-id'] = requestId;
            
            logger.info(`[${requestId}] ${req.method} ${req.path}`, {
                method: req.method,
                path: req.path,
                query: req.query,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            next();
        });
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        // Health check endpoint (before rate limiting)
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                success: true,
                status: 'healthy',
                service: config.app.name,
                version: config.app.version,
                timestamp: new Date().toISOString()
            });
        });

        // Main API routes
        this.app.use('/api', routes);
        
        // Dashboard routes
        const dashboardRoutes = require('./routes/dashboard-routes');
        this.app.use('/api/dashboard', dashboardRoutes);

        // Portfolio routes
        const portfolioRoutes = require('./routes/portfolio-routes');
        this.app.use('/api/portfolio', portfolioRoutes);

        // Manual workflow routes
        const manualWorkflowRoutes = require('./routes/manual-workflow-routes');
        this.app.use('/api/manual-workflow', manualWorkflowRoutes);

        // Rules engine routes
        const rulesEngineRoutes = require('./routes/rules-engine-routes');
        this.app.use('/api/rules-engine', rulesEngineRoutes);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.status(200).json({
                success: true,
                message: `Welcome to ${config.app.name}`,
                version: config.app.version,
                description: config.app.description,
                documentation: '/api-docs',
                health: '/health',
                api: '/api',
                timestamp: new Date().toISOString()
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Not Found',
                message: `Route ${req.method} ${req.originalUrl} not found`,
                availableRoutes: [
                    'GET /',
                    'GET /health',
                    'GET /api',
                    'GET /api/health',
                    'POST /api/pre-qualification/process',
                    'GET /api/pre-qualification/status/:applicationNumber',
                    'GET /api-docs'
                ],
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Setup Swagger documentation
     */
    setupSwagger() {
        if (!config.features.enableSwaggerDocs) {
            return;
        }

        const swaggerOptions = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: config.app.name,
                    version: config.app.version,
                    description: config.app.description,
                    contact: {
                        name: 'Enhanced LOS Team',
                        email: 'support@enhanced-los.com'
                    }
                },
                servers: [
                    {
                        url: `http://localhost:${config.server.port}`,
                        description: 'Development server'
                    }
                ],
                tags: [
                    {
                        name: 'System',
                        description: 'System information and health checks'
                    },
                    {
                        name: 'Pre-Qualification',
                        description: 'Pre-qualification processing and management'
                    }
                ]
            },
            apis: ['./src/routes/*.js'] // Path to the API files
        };

        const swaggerSpec = swaggerJsdoc(swaggerOptions);
        
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: `${config.app.name} API Documentation`
        }));

        // Swagger JSON endpoint
        this.app.get('/api-docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });

        logger.info('Swagger documentation enabled at /api-docs');
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            const requestId = req.headers['x-request-id'];
            
            logger.error(`[${requestId}] Global error handler:`, {
                error: error.message,
                stack: error.stack,
                path: req.path,
                method: req.method
            });

            // Don't leak error details in production
            const errorMessage = config.app.environment === 'development' 
                ? error.message 
                : 'Internal server error';

            res.status(error.status || 500).json({
                success: false,
                error: 'Internal Server Error',
                message: errorMessage,
                requestId,
                timestamp: new Date().toISOString()
            });
        });

        // Unhandled promise rejection handler
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Promise Rejection:', {
                reason: reason,
                promise: promise
            });
        });

        // Uncaught exception handler
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', {
                error: error.message,
                stack: error.stack
            });
            
            // Graceful shutdown
            this.gracefulShutdown();
        });
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Initialize database
            await databaseService.initialize();
            logger.info('Database service initialized');

            logger.info(`${config.app.name} v${config.app.version} initialized successfully`);
            return this.app;
            
        } catch (error) {
            logger.error('Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Graceful shutdown
     */
    async gracefulShutdown() {
        logger.info('Starting graceful shutdown...');
        
        try {
            // Close database connections
            await databaseService.close();
            logger.info('Database connections closed');
            
            logger.info('Graceful shutdown completed');
            process.exit(0);
            
        } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    }

    /**
     * Get Express app instance
     */
    getApp() {
        return this.app;
    }
}

module.exports = EnhancedLOSApp;