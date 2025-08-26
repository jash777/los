/**
 * Application Configuration
 * Consolidated configuration for the loan management system
 */

require('dotenv').config();

const config = {
  // Application Info
  app: {
    name: 'Loan Management System',
    version: '2.0.0',
    description: 'Multi-phase loan origination and management system',
    environment: process.env.NODE_ENV || 'development'
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'loan_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // External API Configuration
  externalApis: {
    surepass: {
      baseUrl: 'https://api.surepass.io/api/v1',
      authToken: process.env.SUREPASS_AUTH_TOKEN,
      timeout: 30000
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    }
  },

  // Security Configuration
  security: {
    corsOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100,
    bcryptRounds: 10
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    uploadPath: './uploads'
  },

  // Business Rules
  business: {
    loanAmount: {
      min: 10000,
      max: 1000000
    },
    tenure: {
      min: 6,
      max: 60
    },
    creditScore: {
      min: 650
    },
    age: {
      min: 21,
      max: 65
    }
  },

  // Feature Flags
  features: {
    enableAuditLogging: true,
    enableAiAnalysis: true,
    enableRealTimeNotifications: true
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: './logs/app.log',
    maxSize: '10m',
    maxFiles: 5
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