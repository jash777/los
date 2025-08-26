/**
 * Main Application Entry Point
 * Loan Management System v2.0
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

// Core configuration
const config = require('./middleware/config/app.config');
const swaggerSpecs = require('./middleware/config/openapi');

// Middleware
const authMiddleware = require('./middleware/auth');

// Component routes
const authRoutes = require('./middleware/auth/auth.routes');
const documentRoutes = require('./components/document-management/documents.routes');
const esignRoutes = require('./components/document-management/esign.routes');
const loanOriginationRoutes = require('./components/routes');
const employeeDashboardRoutes = require('./components/employee-dashboard/employee-dashboard.routes');
const dualPhaseWorkflowRoutes = require('./components/dual-phase-workflow.routes');

// API routes
const auditRoutes = require('./middleware/routes/audit.routes');
const metricsRoutes = require('./middleware/routes/metrics.routes');

const app = express();

// Enhanced request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip}`);
  
  // Log body for POST/PUT/PATCH requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***hidden***';
    if (sanitizedBody.otp) sanitizedBody.otp = '***hidden***';
    console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
  }
  
  next();
});

// Security and performance middleware
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const { simpleRateLimiter } = require('./middleware/rate-limiter');
app.use(simpleRateLimiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve static files from public directory
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/esign', esignRoutes);
app.use('/api/loan-origination', loanOriginationRoutes);
app.use('/api/employee-dashboard', employeeDashboardRoutes);
app.use('/api/dual-phase-workflow', dualPhaseWorkflowRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/metrics', metricsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.environment,
    system: config.app.name,
    version: config.app.version,
    features: {
      loanOrigination: 'active',
      employeeDashboard: 'active',
      documentManagement: 'active',
      auditLogging: config.features.enableAuditLogging,
      aiAnalysis: config.features.enableAiAnalysis
    }
  });
});

// Test route
app.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    version: config.app.version
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: config.app.name + ' API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Serve API documentation at root
app.get('/', (req, res) => {
  console.log('API documentation requested - redirecting to Swagger UI');
  res.redirect('/api-docs');
});

// Legacy HTML documentation (backup)
app.get('/docs', (req, res) => {
  console.log('Legacy documentation requested');
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Serve static files
app.use(express.static(publicDir));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: config.app.environment === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server if this file is run directly
if (require.main === module) {
  const PORT = config.app.port || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 ${config.app.name} Server Started`);
    console.log(`📍 Environment: ${config.app.environment}`);
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`\n✅ All imports loaded successfully!`);
  });
}

module.exports = app;