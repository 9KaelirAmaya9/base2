/**
 * Dashboard Routes
 * API endpoints for dashboard management
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/dashboards
 * Create a new dashboard
 */
router.post('/', dashboardController.createDashboard);

/**
 * POST /api/dashboards/sync-all
 * Sync all active dashboards
 */
router.post('/sync-all', dashboardController.syncAllDashboards);

/**
 * POST /api/dashboards/sales/:dashboardId/sync
 * Sync sales dashboard
 */
router.post('/sales/:dashboardId/sync', dashboardController.syncSalesDashboard);

/**
 * POST /api/dashboards/operations/:dashboardId/sync
 * Sync operations dashboard
 */
router.post('/operations/:dashboardId/sync', dashboardController.syncOperationsDashboard);

/**
 * POST /api/dashboards/financial/:dashboardId/sync
 * Sync financial dashboard
 */
router.post('/financial/:dashboardId/sync', dashboardController.syncFinancialDashboard);

/**
 * GET /api/dashboards/:dashboardId/insights
 * Get dashboard insights
 */
router.get('/:dashboardId/insights', dashboardController.getDashboardInsights);

/**
 * GET /api/dashboards/:dashboardId/export
 * Export dashboard
 * Query params: format (csv, pdf, xlsx)
 */
router.get('/:dashboardId/export', dashboardController.exportDashboard);

module.exports = router;
