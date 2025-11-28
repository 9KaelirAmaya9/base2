/**
 * Dashboard Service
 * Automated dashboard management with real-time sync and Gemini insights
 */

const SheetsService = require('../workspace/SheetsService');
const GeminiService = require('../gemini/GeminiService');
const cron = require('node-cron');

class DashboardService {
  constructor(db) {
    this.db = db;
    this.sheets = new SheetsService();
    this.gemini = new GeminiService();
    this.initialized = false;
    this.scheduledJobs = [];
  }

  /**
   * Initialize dashboard service
   */
  async initialize() {
    await Promise.all([this.sheets.initialize(), this.gemini.initialize()]);

    this.initialized = true;
    return this;
  }

  /**
   * Ensure initialized
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('DashboardService not initialized. Call initialize() first.');
    }
  }

  /**
   * Sync sales dashboard
   * @param {string} dashboardId - Dashboard ID
   */
  async syncSalesDashboard(dashboardId) {
    this.ensureInitialized();

    console.log('Syncing sales dashboard...');

    const dashboard = await this.getDashboard(dashboardId);
    const spreadsheetId = dashboard.google_sheet_id;

    // 1. Get sales data from contracts
    const salesData = await this.getSalesData();

    // 2. Prepare data for sheets
    const headers = [
      'Month',
      'Contract Count',
      'Total Value',
      'New Customers',
      'Avg Contract Value',
      'Status',
    ];

    const rows = [headers];

    for (const row of salesData) {
      rows.push([
        row.month,
        row.contract_count,
        row.total_value,
        row.new_customers,
        row.avg_contract_value,
        row.status,
      ]);
    }

    // 3. Update Google Sheets
    await this.sheets.updateValues(spreadsheetId, 'Sales Data!A1', rows);

    // 4. Generate insights with Gemini
    const insights = await this.gemini.generateDashboardInsights(salesData, 'sales');

    // 5. Update insights sheet
    const insightsData = [
      ['Generated At', new Date().toISOString()],
      [''],
      ['Key Insights'],
      [insights.text],
    ];

    await this.sheets.updateValues(spreadsheetId, 'Insights!A1', insightsData);

    // 6. Update dashboard metadata
    await this.updateDashboardSync(dashboardId, insights.text, insights.tokensUsed);

    console.log('Sales dashboard synced successfully');

    return {
      success: true,
      recordsProcessed: salesData.length,
      insights: insights.text,
    };
  }

  /**
   * Sync operations dashboard
   * @param {string} dashboardId - Dashboard ID
   */
  async syncOperationsDashboard(dashboardId) {
    this.ensureInitialized();

    console.log('Syncing operations dashboard...');

    const dashboard = await this.getDashboard(dashboardId);
    const spreadsheetId = dashboard.google_sheet_id;

    // 1. Get operations data
    const operationsData = await this.getOperationsData();

    // 2. Prepare data for sheets
    const headers = ['Project', 'Status', 'Progress', 'Due Date', 'Owner', 'Priority'];
    const rows = [headers];

    for (const row of operationsData) {
      rows.push([
        row.project_name,
        row.status,
        `${row.progress}%`,
        row.due_date,
        row.owner,
        row.priority,
      ]);
    }

    // 3. Update Google Sheets
    await this.sheets.updateValues(spreadsheetId, 'Operations!A1', rows);

    // 4. Generate insights
    const insights = await this.gemini.generateDashboardInsights(
      operationsData,
      'operations'
    );

    // 5. Update insights
    await this.sheets.updateValues(spreadsheetId, 'Insights!A1', [
      ['Generated At', new Date().toISOString()],
      [''],
      ['Operational Insights'],
      [insights.text],
    ]);

    // 6. Update dashboard metadata
    await this.updateDashboardSync(dashboardId, insights.text, insights.tokensUsed);

    return {
      success: true,
      recordsProcessed: operationsData.length,
      insights: insights.text,
    };
  }

  /**
   * Sync financial dashboard
   * @param {string} dashboardId - Dashboard ID
   */
  async syncFinancialDashboard(dashboardId) {
    this.ensureInitialized();

    console.log('Syncing financial dashboard...');

    const dashboard = await this.getDashboard(dashboardId);
    const spreadsheetId = dashboard.google_sheet_id;

    // 1. Get financial data
    const financialData = await this.getFinancialData();

    // 2. Prepare data for sheets
    const headers = [
      'Month',
      'Revenue',
      'Expenses',
      'Net Income',
      'Contract Value',
      'Margin %',
    ];
    const rows = [headers];

    for (const row of financialData) {
      rows.push([
        row.month,
        row.revenue,
        row.expenses,
        row.net_income,
        row.contract_value,
        row.margin_percentage,
      ]);
    }

    // 3. Update Google Sheets
    await this.sheets.updateValues(spreadsheetId, 'Financial Data!A1', rows);

    // 4. Generate insights
    const insights = await this.gemini.generateDashboardInsights(
      financialData,
      'financial'
    );

    // 5. Update insights
    await this.sheets.updateValues(spreadsheetId, 'Insights!A1', [
      ['Generated At', new Date().toISOString()],
      [''],
      ['Financial Insights'],
      [insights.text],
    ]);

    // 6. Update dashboard metadata
    await this.updateDashboardSync(dashboardId, insights.text, insights.tokensUsed);

    return {
      success: true,
      recordsProcessed: financialData.length,
      insights: insights.text,
    };
  }

  /**
   * Get sales data from database
   */
  async getSalesData() {
    const result = await this.db.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as contract_count,
        COALESCE(SUM(total_value), 0) as total_value,
        COUNT(DISTINCT party_name) as new_customers,
        COALESCE(AVG(total_value), 0) as avg_contract_value,
        status
      FROM contracts
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM'), status
      ORDER BY month DESC
    `);

    return result.rows;
  }

  /**
   * Get operations data from database
   */
  async getOperationsData() {
    // Mock data - replace with actual project/task data
    const result = await this.db.query(`
      SELECT
        contract_number as project_name,
        status,
        CASE
          WHEN status = 'completed' THEN 100
          WHEN status = 'active' THEN 50
          ELSE 0
        END as progress,
        expiration_date as due_date,
        'System' as owner,
        CASE
          WHEN expiration_date < CURRENT_DATE + INTERVAL '7 days' THEN 'High'
          WHEN expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Medium'
          ELSE 'Low'
        END as priority
      FROM contracts
      WHERE status IN ('active', 'pending_signature')
      ORDER BY expiration_date ASC
      LIMIT 50
    `);

    return result.rows;
  }

  /**
   * Get financial data from database
   */
  async getFinancialData() {
    const result = await this.db.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN status = 'active' THEN total_value ELSE 0 END), 0) as revenue,
        0 as expenses,
        COALESCE(SUM(CASE WHEN status = 'active' THEN total_value ELSE 0 END), 0) as net_income,
        COALESCE(SUM(total_value), 0) as contract_value,
        100 as margin_percentage
      FROM contracts
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `);

    return result.rows;
  }

  /**
   * Get dashboard by ID
   * @param {string} dashboardId - Dashboard ID
   */
  async getDashboard(dashboardId) {
    const result = await this.db.query('SELECT * FROM dashboards WHERE dashboard_id = $1', [
      dashboardId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Update dashboard sync metadata
   * @param {string} dashboardId - Dashboard ID
   * @param {string} insights - Generated insights
   * @param {object} tokensUsed - Tokens used
   */
  async updateDashboardSync(dashboardId, insights, tokensUsed) {
    await this.db.query(
      `UPDATE dashboards
       SET last_sync_at = CURRENT_TIMESTAMP,
           gemini_insights = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE dashboard_id = $1`,
      [dashboardId, JSON.stringify({ insights, tokensUsed, generatedAt: new Date() })]
    );

    // Log sync
    await this.db.query(
      `INSERT INTO workspace_sync_log (sync_type, resource_type, resource_id, status, completed_at)
       VALUES ('dashboard', 'dashboard', $1, 'success', CURRENT_TIMESTAMP)`,
      [dashboardId]
    );
  }

  /**
   * Sync all dashboards
   */
  async syncAllDashboards() {
    this.ensureInitialized();

    console.log('Syncing all dashboards...');

    const result = await this.db.query(
      'SELECT dashboard_id, dashboard_type FROM dashboards WHERE is_active = true'
    );

    const results = [];

    for (const dashboard of result.rows) {
      try {
        let syncResult;

        switch (dashboard.dashboard_type) {
          case 'sales':
            syncResult = await this.syncSalesDashboard(dashboard.dashboard_id);
            break;
          case 'operations':
            syncResult = await this.syncOperationsDashboard(dashboard.dashboard_id);
            break;
          case 'financial':
            syncResult = await this.syncFinancialDashboard(dashboard.dashboard_id);
            break;
          default:
            console.log(`Unknown dashboard type: ${dashboard.dashboard_type}`);
            continue;
        }

        results.push({
          dashboardId: dashboard.dashboard_id,
          type: dashboard.dashboard_type,
          ...syncResult,
        });
      } catch (error) {
        console.error(`Failed to sync dashboard ${dashboard.dashboard_id}:`, error.message);
        results.push({
          dashboardId: dashboard.dashboard_id,
          type: dashboard.dashboard_type,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Schedule automatic dashboard sync
   * @param {string} cronExpression - Cron expression (default: every 15 minutes)
   */
  scheduleSync(cronExpression = '*/15 * * * *') {
    const job = cron.schedule(cronExpression, async () => {
      console.log('Running scheduled dashboard sync...');
      try {
        await this.syncAllDashboards();
      } catch (error) {
        console.error('Scheduled sync failed:', error.message);
      }
    });

    this.scheduledJobs.push(job);

    console.log(`Dashboard sync scheduled: ${cronExpression}`);

    return job;
  }

  /**
   * Stop all scheduled jobs
   */
  stopScheduledJobs() {
    for (const job of this.scheduledJobs) {
      job.stop();
    }
    this.scheduledJobs = [];
    console.log('All scheduled dashboard jobs stopped');
  }

  /**
   * Create new dashboard
   * @param {object} params - Dashboard parameters
   */
  async createDashboard(params) {
    this.ensureInitialized();

    const { dashboardId, name, description, dashboardType, sheetTitles, syncFrequency } =
      params;

    // 1. Create Google Spreadsheet
    const spreadsheet = await this.sheets.createSpreadsheet(
      name,
      sheetTitles || ['Data', 'Insights', 'Charts']
    );

    // 2. Save to database
    const result = await this.db.query(
      `INSERT INTO dashboards (dashboard_id, name, description, dashboard_type, google_sheet_id, sync_frequency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        dashboardId,
        name,
        description,
        dashboardType,
        spreadsheet.id,
        syncFrequency || '15min',
      ]
    );

    return {
      dashboard: result.rows[0],
      spreadsheetUrl: spreadsheet.url,
    };
  }

  /**
   * Get dashboard insights
   * @param {string} dashboardId - Dashboard ID
   */
  async getDashboardInsights(dashboardId) {
    const dashboard = await this.getDashboard(dashboardId);

    return {
      dashboardId,
      name: dashboard.name,
      type: dashboard.dashboard_type,
      lastSync: dashboard.last_sync_at,
      insights: dashboard.gemini_insights,
      url: dashboard.google_drive_url,
    };
  }

  /**
   * Export dashboard data
   * @param {string} dashboardId - Dashboard ID
   * @param {string} format - Export format (csv, pdf)
   */
  async exportDashboard(dashboardId, format = 'csv') {
    this.ensureInitialized();

    const dashboard = await this.getDashboard(dashboardId);

    const DriveService = require('../workspace/DriveService');
    const drive = new DriveService();
    await drive.initialize();

    let mimeType;
    switch (format) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'csv':
        mimeType = 'text/csv';
        break;
      case 'xlsx':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default:
        mimeType = 'text/csv';
    }

    const exportedData = await drive.exportFile(dashboard.google_sheet_id, mimeType);

    return exportedData;
  }
}

module.exports = DashboardService;
