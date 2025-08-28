/**
 * Application Configuration
 * Clean, centralized configuration for Enhanced LOS
 */

require('dotenv').config();

const config = {
    // Application Info
    app: {
        name: 'Enhanced Loan Origination System',
        version: '3.0.0',
        description: 'MySQL-based Enhanced LOS with Complete Application Lifecycle',
        environment: process.env.NODE_ENV || 'development'
    },

    // Server Configuration
    server: {
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Database Configuration (MySQL)
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        name: process.env.DB_NAME || 'loan_origination_system',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        timeout: parseInt(process.env.DB_TIMEOUT) || 60000
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'enhanced-los-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // External Services
    externalServices: {
        thirdPartySimulator: {
            baseUrl: process.env.THIRD_PARTY_SIMULATOR_URL || 'http://localhost:4000',
            timeout: 30000
        }
    },

    // Security Configuration
    security: {
        corsOrigins: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : [
                'http://localhost:3000',
                'http://127.0.0.1:3001',
                'http://localhost:3001',
                'http://127.0.0.1:5500',
                'http://localhost:5500',
                '*'
            ],
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 100
    },

    // File Upload Configuration
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        uploadPath: './uploads'
    },

    // Business Rules
    business: {
        preQualification: {
            minAge: 18,
            maxAge: 70,
            minCibilScore: 550,
            goodCibilScore: 650,
            excellentCibilScore: 750
        },
        loanAmount: {
            min: 10000,
            max: 10000000
        },
        tenure: {
            min: 6,
            max: 60
        }
    },

    // Feature Flags
    features: {
        enableAuditLogging: true,
        enableSwaggerDocs: true,
        enableRateLimiting: true,
        enableCompression: true
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: false
    }
};

// Validation
function validateConfig() {
    const required = [
        'database.host',
        'database.name', 
        'database.user',
        'jwt.secret'
    ];

    for (const key of required) {
        const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
        if (!value) {
            throw new Error(`Missing required configuration: ${key}`);
        }
    }
}

// Validate configuration on load
if (process.env.NODE_ENV !== 'test') {
    validateConfig();
}

module.exports = config;