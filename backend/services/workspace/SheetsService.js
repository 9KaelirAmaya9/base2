/**
 * Google Sheets Service
 * Handles all Google Sheets API operations
 */

const { google } = require('googleapis');
const BaseWorkspaceService = require('./BaseWorkspaceService');

class SheetsService extends BaseWorkspaceService {
  constructor() {
    super(['https://www.googleapis.com/auth/spreadsheets']);
    this.sheets = null;
  }

  /**
   * Initialize Sheets service
   * @param {string} userEmail - User email for delegation
   */
  async initialize(userEmail = null) {
    await super.initialize(userEmail);
    const authClient = await this.auth.getClient();
    this.sheets = google.sheets({ version: 'v4', auth: authClient });
    return this;
  }

  /**
   * Create a new spreadsheet
   * @param {string} title - Spreadsheet title
   * @param {Array} sheetTitles - Array of sheet names
   */
  async createSpreadsheet(title, sheetTitles = ['Sheet1']) {
    this.ensureInitialized();
    this.logApiCall('Sheets', 'createSpreadsheet', { title });

    try {
      const sheets = sheetTitles.map((sheetTitle) => ({
        properties: { title: sheetTitle },
      }));

      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.create({
          requestBody: {
            properties: { title },
            sheets,
          },
        });
      });

      return {
        id: result.data.spreadsheetId,
        title: result.data.properties.title,
        url: result.data.spreadsheetUrl,
        sheets: result.data.sheets,
      };
    } catch (error) {
      this.handleError(error, 'createSpreadsheet');
    }
  }

  /**
   * Get spreadsheet metadata
   * @param {string} spreadsheetId - Spreadsheet ID
   */
  async getSpreadsheet(spreadsheetId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.get({
          spreadsheetId,
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'getSpreadsheet');
    }
  }

  /**
   * Get values from a range
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} range - Range in A1 notation (e.g., 'Sheet1!A1:D10')
   */
  async getValues(spreadsheetId, range) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });
      });

      return result.data.values || [];
    } catch (error) {
      this.handleError(error, 'getValues');
    }
  }

  /**
   * Update values in a range
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} range - Range in A1 notation
   * @param {Array} values - 2D array of values
   * @param {string} valueInputOption - 'RAW' or 'USER_ENTERED'
   */
  async updateValues(spreadsheetId, range, values, valueInputOption = 'USER_ENTERED') {
    this.ensureInitialized();
    this.logApiCall('Sheets', 'updateValues', { spreadsheetId, range });

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption,
          requestBody: {
            values,
          },
        });
      });

      return {
        updatedCells: result.data.updatedCells,
        updatedRows: result.data.updatedRows,
        updatedColumns: result.data.updatedColumns,
      };
    } catch (error) {
      this.handleError(error, 'updateValues');
    }
  }

  /**
   * Append values to a sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} range - Range (sheet name or range)
   * @param {Array} values - 2D array of values
   * @param {string} valueInputOption - 'RAW' or 'USER_ENTERED'
   */
  async appendValues(spreadsheetId, range, values, valueInputOption = 'USER_ENTERED') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption,
          requestBody: {
            values,
          },
        });
      });

      return {
        updatedCells: result.data.updates.updatedCells,
        updatedRows: result.data.updates.updatedRows,
        updatedRange: result.data.updates.updatedRange,
      };
    } catch (error) {
      this.handleError(error, 'appendValues');
    }
  }

  /**
   * Clear values in a range
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} range - Range in A1 notation
   */
  async clearValues(spreadsheetId, range) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.sheets.spreadsheets.values.clear({
          spreadsheetId,
          range,
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'clearValues');
    }
  }

  /**
   * Batch get multiple ranges
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {Array} ranges - Array of range strings
   */
  async batchGetValues(spreadsheetId, ranges) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges,
        });
      });

      return result.data.valueRanges;
    } catch (error) {
      this.handleError(error, 'batchGetValues');
    }
  }

  /**
   * Batch update multiple ranges
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {Array} data - Array of {range, values} objects
   * @param {string} valueInputOption - 'RAW' or 'USER_ENTERED'
   */
  async batchUpdateValues(spreadsheetId, data, valueInputOption = 'USER_ENTERED') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption,
            data,
          },
        });
      });

      return {
        totalUpdatedCells: result.data.totalUpdatedCells,
        totalUpdatedRows: result.data.totalUpdatedRows,
        totalUpdatedSheets: result.data.totalUpdatedSheets,
      };
    } catch (error) {
      this.handleError(error, 'batchUpdateValues');
    }
  }

  /**
   * Add a new sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} title - Sheet title
   */
  async addSheet(spreadsheetId, title) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title,
                  },
                },
              },
            ],
          },
        });
      });

      return result.data.replies[0].addSheet.properties;
    } catch (error) {
      this.handleError(error, 'addSheet');
    }
  }

  /**
   * Delete a sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID (not title)
   */
  async deleteSheet(spreadsheetId, sheetId) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteSheet: {
                  sheetId,
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'deleteSheet');
    }
  }

  /**
   * Format cells
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {object} range - Grid range {startRowIndex, endRowIndex, startColumnIndex, endColumnIndex}
   * @param {object} format - Cell format options
   */
  async formatCells(spreadsheetId, sheetId, range, format) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    ...range,
                  },
                  cell: {
                    userEnteredFormat: format,
                  },
                  fields: 'userEnteredFormat',
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'formatCells');
    }
  }

  /**
   * Set column width
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {number} columnIndex - Column index (0-based)
   * @param {number} width - Width in pixels
   */
  async setColumnWidth(spreadsheetId, sheetId, columnIndex, width) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                updateDimensionProperties: {
                  range: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: columnIndex,
                    endIndex: columnIndex + 1,
                  },
                  properties: {
                    pixelSize: width,
                  },
                  fields: 'pixelSize',
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'setColumnWidth');
    }
  }

  /**
   * Auto-resize columns
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {number} sheetId - Sheet ID
   * @param {number} startColumnIndex - Start column index
   * @param {number} endColumnIndex - End column index
   */
  async autoResizeColumns(spreadsheetId, sheetId, startColumnIndex, endColumnIndex) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: startColumnIndex,
                    endIndex: endColumnIndex,
                  },
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'autoResizeColumns');
    }
  }

  /**
   * Create pivot table
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {object} pivotConfig - Pivot table configuration
   */
  async createPivotTable(spreadsheetId, pivotConfig) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                updateCells: {
                  rows: [
                    {
                      values: [
                        {
                          pivotTable: pivotConfig,
                        },
                      ],
                    },
                  ],
                  fields: 'pivotTable',
                  start: pivotConfig.anchorCell,
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'createPivotTable');
    }
  }

  /**
   * Add chart
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {object} chartSpec - Chart specification
   */
  async addChart(spreadsheetId, chartSpec) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addChart: {
                  chart: chartSpec,
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'addChart');
    }
  }

  /**
   * Batch update (generic)
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {Array} requests - Array of request objects
   */
  async batchUpdate(spreadsheetId, requests) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests },
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'batchUpdate');
    }
  }

  /**
   * Helper: Convert column letter to index
   * @param {string} column - Column letter (e.g., 'A', 'B', 'AA')
   */
  columnLetterToIndex(column) {
    let index = 0;
    for (let i = 0; i < column.length; i++) {
      index = index * 26 + column.charCodeAt(i) - 64;
    }
    return index - 1; // 0-based
  }

  /**
   * Helper: Convert column index to letter
   * @param {number} index - 0-based column index
   */
  columnIndexToLetter(index) {
    let letter = '';
    index++; // Make 1-based
    while (index > 0) {
      const remainder = (index - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      index = Math.floor((index - 1) / 26);
    }
    return letter;
  }
}

module.exports = SheetsService;
