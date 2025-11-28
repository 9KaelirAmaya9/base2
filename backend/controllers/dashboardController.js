/**
 * Dashboard Controller
 * Handles dashboard-related API endpoints
 */

const DashboardService = require('../services/dashboard/DashboardService');
const db = require('../config/database');

/**
 * Sync sales dashboard
 */
const syncSalesDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const dashboardService = new DashboardService(db);
    await dashboardService.initialize();

    const result = await dashboardService.syncSalesDashboard(dashboardId);

    res.json(result);
  } catch (error) {
    console.error('Sync sales dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Sync operations dashboard
 */
const syncOperationsDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const dashboardService = new DashboardService(db);
    await dashboardService.initialize();

    const result = await dashboardService.syncOperationsDashboard(dashboardId);

    res.json(result);
  } catch (error) {
    console.error('Sync operations dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Sync financial dashboard
 */
const syncFinancialDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const dashboardService = new DashboardService(db);
    await dashboardService.initialize();

    const result = await dashboardService.syncFinancialDashboard(dashboardId);

    res.json(result);
  } catch (error) {
    console.error('Sync financial dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Sync all dashboards
 */
const syncAllDashboards = async (req, res) => {
  try {
    const dashboardService = new DashboardService(db);
    await dashboardService.initialize();

    const results = await dashboardService.syncAllDashboards();

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Sync all dashboards error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get dashboard insights
 */
const getDashboardInsights = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const dashboardService = new DashboardService(db);
    const insights = await dashboardService.getDashboardInsights(dashboardId);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Get dashboard insights error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create dashboard
 */
const createDashboard = async (req, res) => {
  try {
    const { dashboardId, name, description, dashboardType, sheetTitles, syncFrequency } =
      req.body;

    if (!dashboardId || !name || !dashboardType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: dashboardId, name, dashboardType',
      });
    }

    const dashboardService = new DashboardService(db);
    await dashboardService.initialize();

    const result = await dashboardService.createDashboard({
      dashboardId,
      name,
      description,
      dashboardType,
      sheetTitles,
      syncFrequency,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Export dashboard
 */
const exportDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { format } = req.query;

    const dashboardService = new DashboardService(db);
    await dashboardService.initialize();

    const exportedData = await dashboardService.exportDashboard(
      dashboardId,
      format || 'csv'
    );

    // Set appropriate headers
    const mimeTypes = {
      csv: 'text/csv',
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    res.setHeader('Content-Type', mimeTypes[format] || 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dashboard-${dashboardId}.${format || 'csv'}"`
    );

    res.send(exportedData);
  } catch (error) {
    console.error('Export dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  syncSalesDashboard,
  syncOperationsDashboard,
  syncFinancialDashboard,
  syncAllDashboards,
  getDashboardInsights,
  createDashboard,
  exportDashboard,
};
