/**
 * Environment Configuration
 * Centralized environment variable management
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
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

  // API Keys and External Services
  apis: {
    panVerification: {
      endpoint: process.env.PAN_VERIFICATION_API || 'https://api.surepass.io/api/v1/pan',
      apiKey: process.env.SUREPASS_API_KEY || null
    },
    cibil: {
      endpoint: process.env.CIBIL_API_ENDPOINT || 'https://api.cibil.com/v1/score',
      apiKey: process.env.CIBIL_API_KEY || null,
      partnerId: process.env.CIBIL_PARTNER_ID || null
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || null
    }
  },

  // Security Configuration
  security: {
    corsOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'application/pdf'],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },

  // Feature Flags
  features: {
    enableTrendsApi: process.env.ENABLE_TRENDS_API !== 'false',
    enableModulesApi: process.env.ENABLE_MODULES_API !== 'false',
    enableDashboardApi: process.env.ENABLE_DASHBOARD_API !== 'false',
    enableAutoWorkflow: process.env.ENABLE_AUTO_WORKFLOW !== 'false',
    enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false'
  },

  // Business Rules
  business: {
    minLoanAmount: parseInt(process.env.MIN_LOAN_AMOUNT) || 10000,
    maxLoanAmount: parseInt(process.env.MAX_LOAN_AMOUNT) || 1000000,
    minTenure: parseInt(process.env.MIN_TENURE) || 6,
    maxTenure: parseInt(process.env.MAX_TENURE) || 60,
    minCibilScore: parseInt(process.env.MIN_CIBIL_SCORE) || 650,
    minAge: parseInt(process.env.MIN_AGE) || 21,
    maxAge: parseInt(process.env.MAX_AGE) || 65
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