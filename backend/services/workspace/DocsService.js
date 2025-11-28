/**
 * Google Docs Service
 * Handles all Google Docs API operations
 */

const { google } = require('googleapis');
const BaseWorkspaceService = require('./BaseWorkspaceService');

class DocsService extends BaseWorkspaceService {
  constructor() {
    super(['https://www.googleapis.com/auth/documents']);
    this.docs = null;
  }

  /**
   * Initialize Docs service
   * @param {string} userEmail - User email for delegation
   */
  async initialize(userEmail = null) {
    await super.initialize(userEmail);
    const authClient = await this.auth.getClient();
    this.docs = google.docs({ version: 'v1', auth: authClient });
    return this;
  }

  /**
   * Create a new document
   * @param {string} title - Document title
   */
  async createDocument(title) {
    this.ensureInitialized();
    this.logApiCall('Docs', 'createDocument', { title });

    try {
      const result = await this.retry(async () => {
        return await this.docs.documents.create({
          requestBody: {
            title,
          },
        });
      });

      return {
        id: result.data.documentId,
        title: result.data.title,
        url: `https://docs.google.com/document/d/${result.data.documentId}/edit`,
      };
    } catch (error) {
      this.handleError(error, 'createDocument');
    }
  }

  /**
   * Get document content
   * @param {string} documentId - Document ID
   */
  async getDocument(documentId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.docs.documents.get({
          documentId,
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'getDocument');
    }
  }

  /**
   * Extract text content from document
   * @param {string} documentId - Document ID
   */
  async getDocumentText(documentId) {
    const doc = await this.getDocument(documentId);
    let text = '';

    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          }
        }
      }
    }

    return text;
  }

  /**
   * Insert text into document
   * @param {string} documentId - Document ID
   * @param {string} text - Text to insert
   * @param {number} index - Insert position (default: 1, after title)
   */
  async insertText(documentId, text, index = 1) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index },
                  text,
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'insertText');
    }
  }

  /**
   * Replace text in document
   * @param {string} documentId - Document ID
   * @param {string} find - Text to find
   * @param {string} replace - Replacement text
   */
  async replaceText(documentId, find, replace) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                replaceAllText: {
                  containsText: {
                    text: find,
                    matchCase: false,
                  },
                  replaceText: replace,
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'replaceText');
    }
  }

  /**
   * Replace multiple placeholders
   * @param {string} documentId - Document ID
   * @param {object} replacements - Object with placeholder: value pairs
   */
  async replacePlaceholders(documentId, replacements) {
    this.ensureInitialized();

    const requests = [];

    for (const [placeholder, value] of Object.entries(replacements)) {
      requests.push({
        replaceAllText: {
          containsText: {
            text: placeholder,
            matchCase: false,
          },
          replaceText: String(value),
        },
      });
    }

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: { requests },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'replacePlaceholders');
    }
  }

  /**
   * Apply text formatting
   * @param {string} documentId - Document ID
   * @param {number} startIndex - Start index
   * @param {number} endIndex - End index
   * @param {object} formatting - Formatting options (bold, italic, fontSize, etc.)
   */
  async formatText(documentId, startIndex, endIndex, formatting) {
    this.ensureInitialized();

    const textStyle = {};

    if (formatting.bold !== undefined) textStyle.bold = formatting.bold;
    if (formatting.italic !== undefined) textStyle.italic = formatting.italic;
    if (formatting.underline !== undefined) textStyle.underline = formatting.underline;
    if (formatting.fontSize) textStyle.fontSize = { magnitude: formatting.fontSize, unit: 'PT' };
    if (formatting.fontFamily) textStyle.weightedFontFamily = { fontFamily: formatting.fontFamily };
    if (formatting.foregroundColor)
      textStyle.foregroundColor = { color: { rgbColor: formatting.foregroundColor } };

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                updateTextStyle: {
                  range: {
                    startIndex,
                    endIndex,
                  },
                  textStyle,
                  fields: Object.keys(textStyle).join(','),
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'formatText');
    }
  }

  /**
   * Insert table
   * @param {string} documentId - Document ID
   * @param {number} rows - Number of rows
   * @param {number} columns - Number of columns
   * @param {number} index - Insert position
   */
  async insertTable(documentId, rows, columns, index = 1) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertTable: {
                  rows,
                  columns,
                  location: { index },
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'insertTable');
    }
  }

  /**
   * Create document from template
   * @param {string} templateId - Template document ID
   * @param {string} title - New document title
   * @param {object} replacements - Placeholder replacements
   */
  async createFromTemplate(templateId, title, replacements = {}) {
    this.ensureInitialized();
    this.logApiCall('Docs', 'createFromTemplate', { templateId, title });

    try {
      // First, get DriveService to copy the template
      const DriveService = require('./DriveService');
      const driveService = new DriveService();
      await driveService.initialize();

      // Copy the template
      const newDoc = await driveService.copyFile(templateId, title);

      // Replace placeholders if any
      if (Object.keys(replacements).length > 0) {
        await this.replacePlaceholders(newDoc.id, replacements);
      }

      return {
        id: newDoc.id,
        title,
        url: newDoc.url,
      };
    } catch (error) {
      this.handleError(error, 'createFromTemplate');
    }
  }

  /**
   * Insert page break
   * @param {string} documentId - Document ID
   * @param {number} index - Insert position
   */
  async insertPageBreak(documentId, index) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertPageBreak: {
                  location: { index },
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'insertPageBreak');
    }
  }

  /**
   * Delete content range
   * @param {string} documentId - Document ID
   * @param {number} startIndex - Start index
   * @param {number} endIndex - End index
   */
  async deleteContent(documentId, startIndex, endIndex) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                deleteContentRange: {
                  range: {
                    startIndex,
                    endIndex,
                  },
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'deleteContent');
    }
  }

  /**
   * Apply paragraph style
   * @param {string} documentId - Document ID
   * @param {number} startIndex - Start index
   * @param {number} endIndex - End index
   * @param {string} namedStyle - Named style (e.g., 'HEADING_1', 'TITLE', 'NORMAL_TEXT')
   */
  async applyParagraphStyle(documentId, startIndex, endIndex, namedStyle) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                updateParagraphStyle: {
                  range: {
                    startIndex,
                    endIndex,
                  },
                  paragraphStyle: {
                    namedStyleType: namedStyle,
                  },
                  fields: 'namedStyleType',
                },
              },
            ],
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'applyParagraphStyle');
    }
  }

  /**
   * Batch update requests
   * @param {string} documentId - Document ID
   * @param {Array} requests - Array of request objects
   */
  async batchUpdate(documentId, requests) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.docs.documents.batchUpdate({
          documentId,
          requestBody: { requests },
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'batchUpdate');
    }
  }
}

module.exports = DocsService;
