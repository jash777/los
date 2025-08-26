/**
 * Components Index
 * Centralized exports for all component modules
 */

const documentRoutes = require('./document-management/documents.routes');
const esignRoutes = require('./document-management/esign.routes');
const loanOriginationRoutes = require('./routes');
const employeeDashboardRoutes = require('./employee-dashboard/employee-dashboard.routes');
const dualPhaseWorkflowRoutes = require('./dual-phase-workflow.routes');

// Component modules
const preQualificationRoutes = require('./pre-qualification/routes');
const loanApplicationRoutes = require('./loan-application/routes');
const applicationProcessingRoutes = require('./application-processing/routes');
const underwritingRoutes = require('./underwriting/routes');
const creditDecisionRoutes = require('./credit-decision/routes');
const qualityCheckRoutes = require('./quality-check/routes');
const loanFundingRoutes = require('./loan-funding/routes');

module.exports = {
  documentRoutes,
  esignRoutes,
  loanOriginationRoutes,
  employeeDashboardRoutes,
  dualPhaseWorkflowRoutes,
  preQualificationRoutes,
  loanApplicationRoutes,
  applicationProcessingRoutes,
  underwritingRoutes,
  creditDecisionRoutes,
  qualityCheckRoutes,
  loanFundingRoutes
};