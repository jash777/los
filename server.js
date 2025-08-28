/**
 * Enhanced LOS Server
 * Main server entry point
 */

const EnhancedLOSApp = require('./src/app');
const config = require('./src/config/app');
const logger = require('./src/utils/logger');

async function startServer() {
    try {
        // Create and initialize application
        const appInstance = new EnhancedLOSApp();
        const app = await appInstance.initialize();
        
        // Start server
        const server = app.listen(config.server.port, config.server.host, () => {
            logger.info(`🚀 ${config.app.name} v${config.app.version} started successfully!`);
            logger.info(`📊 Server running on http://${config.server.host}:${config.server.port}`);
            logger.info(`📚 API Documentation: http://${config.server.host}:${config.server.port}/api-docs`);
            logger.info(`🏥 Health Check: http://${config.server.host}:${config.server.port}/health`);
            logger.info(`🔧 Environment: ${config.app.environment}`);
            logger.info(`💾 Database: MySQL (${config.database.name})`);
        });

        // Graceful shutdown handlers
        const gracefulShutdown = async (signal) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                logger.info('HTTP server closed');
                await appInstance.gracefulShutdown();
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();