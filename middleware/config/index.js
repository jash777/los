/**
 * Configuration Index
 * Centralized exports for all configuration modules
 */

const appConfig = require('./app.config');
const database = require('./database');
const openapi = require('./openapi');

module.exports = {
  appConfig,
  database,
  openapi
};