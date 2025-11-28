/**
 * Gmail Service
 * Handles all Gmail API operations
 */

const { google } = require('googleapis');
const BaseWorkspaceService = require('./BaseWorkspaceService');

class GmailService extends BaseWorkspaceService {
  constructor() {
    super([
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
    ]);
    this.gmail = null;
  }

  /**
   * Initialize Gmail service
   * @param {string} userEmail - User email for delegation
   */
  async initialize(userEmail = null) {
    await super.initialize(userEmail);
    const authClient = await this.auth.getClient();
    this.gmail = google.gmail({ version: 'v1', auth: authClient });
    return this;
  }

  /**
   * Send an email
   * @param {object} params - Email parameters
   * @param {string} params.to - Recipient email
   * @param {string} params.subject - Email subject
   * @param {string} params.body - Email body (HTML or plain text)
   * @param {string} params.from - Sender email (optional)
   * @param {Array} params.cc - CC recipients (optional)
   * @param {Array} params.bcc - BCC recipients (optional)
   * @param {Array} params.attachments - Attachments (optional)
   */
  async sendEmail({ to, subject, body, from = null, cc = [], bcc = [], attachments = [] }) {
    this.ensureInitialized();
    this.logApiCall('Gmail', 'sendEmail', { to, subject });

    try {
      const message = this.createEmail({
        to,
        from: from || process.env.GOOGLE_ADMIN_EMAIL,
        subject,
        body,
        cc,
        bcc,
        attachments,
      });

      const result = await this.retry(async () => {
        return await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: message,
          },
        });
      });

      return {
        success: true,
        messageId: result.data.id,
        threadId: result.data.threadId,
      };
    } catch (error) {
      this.handleError(error, 'sendEmail');
    }
  }

  /**
   * Create RFC 2822 formatted email
   * @param {object} emailData - Email data
   */
  createEmail({ to, from, subject, body, cc = [], bcc = [], attachments = [] }) {
    const boundary = 'boundary-' + Date.now();
    let email = [];

    // Headers
    email.push(`From: ${from}`);
    email.push(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    if (cc.length > 0) email.push(`Cc: ${cc.join(', ')}`);
    if (bcc.length > 0) email.push(`Bcc: ${bcc.join(', ')}`);
    email.push(`Subject: ${subject}`);
    email.push('MIME-Version: 1.0');

    if (attachments.length > 0) {
      email.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      email.push('');
      email.push(`--${boundary}`);
    }

    // Body
    email.push('Content-Type: text/html; charset=UTF-8');
    email.push('Content-Transfer-Encoding: 7bit');
    email.push('');
    email.push(body);

    // Attachments
    for (const attachment of attachments) {
      email.push('');
      email.push(`--${boundary}`);
      email.push(`Content-Type: ${attachment.mimeType || 'application/octet-stream'}`);
      email.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      email.push('Content-Transfer-Encoding: base64');
      email.push('');
      email.push(attachment.data); // Should be base64 encoded
    }

    if (attachments.length > 0) {
      email.push(`--${boundary}--`);
    }

    const emailString = email.join('\r\n');
    return Buffer.from(emailString)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Get messages from inbox
   * @param {object} params - Query parameters
   * @param {string} params.query - Gmail search query
   * @param {number} params.maxResults - Maximum results (default: 10)
   * @param {string} params.labelIds - Label IDs to filter
   */
  async getMessages({ query = '', maxResults = 10, labelIds = ['INBOX'] } = {}) {
    this.ensureInitialized();
    this.logApiCall('Gmail', 'getMessages', { query, maxResults });

    try {
      const result = await this.retry(async () => {
        return await this.gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults,
          labelIds,
        });
      });

      const messages = result.data.messages || [];
      const detailedMessages = [];

      // Get full message details for each message
      for (const message of messages) {
        const details = await this.getMessage(message.id);
        detailedMessages.push(details);
      }

      return detailedMessages;
    } catch (error) {
      this.handleError(error, 'getMessages');
    }
  }

  /**
   * Get a single message by ID
   * @param {string} messageId - Message ID
   */
  async getMessage(messageId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });
      });

      return this.parseMessage(result.data);
    } catch (error) {
      this.handleError(error, 'getMessage');
    }
  }

  /**
   * Parse Gmail message
   * @param {object} message - Raw Gmail message
   */
  parseMessage(message) {
    const headers = message.payload.headers;
    const getHeader = (name) => {
      const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : null;
    };

    const parsed = {
      id: message.id,
      threadId: message.threadId,
      labelIds: message.labelIds,
      snippet: message.snippet,
      internalDate: new Date(parseInt(message.internalDate)),
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      cc: getHeader('Cc'),
      bcc: getHeader('Bcc'),
      date: getHeader('Date'),
      body: this.extractBody(message.payload),
      attachments: this.extractAttachments(message.payload),
    };

    return parsed;
  }

  /**
   * Extract email body from message payload
   * @param {object} payload - Message payload
   */
  extractBody(payload) {
    let body = { text: '', html: '' };

    if (payload.body && payload.body.data) {
      const data = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/html') {
        body.html = data;
      } else {
        body.text = data;
      }
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body.text = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body.data) {
          body.html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          const nestedBody = this.extractBody(part);
          body.text = body.text || nestedBody.text;
          body.html = body.html || nestedBody.html;
        }
      }
    }

    return body;
  }

  /**
   * Extract attachments from message
   * @param {object} payload - Message payload
   */
  extractAttachments(payload, attachments = []) {
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId,
          });
        }

        if (part.parts) {
          this.extractAttachments(part, attachments);
        }
      }
    }

    return attachments;
  }

  /**
   * Get attachment data
   * @param {string} messageId - Message ID
   * @param {string} attachmentId - Attachment ID
   */
  async getAttachment(messageId, attachmentId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.gmail.users.messages.attachments.get({
          userId: 'me',
          messageId,
          id: attachmentId,
        });
      });

      return Buffer.from(result.data.data, 'base64');
    } catch (error) {
      this.handleError(error, 'getAttachment');
    }
  }

  /**
   * Search emails
   * @param {string} query - Gmail search query (e.g., "from:example@gmail.com subject:invoice")
   * @param {number} maxResults - Maximum results
   */
  async searchEmails(query, maxResults = 50) {
    return await this.getMessages({ query, maxResults });
  }

  /**
   * Add labels to message
   * @param {string} messageId - Message ID
   * @param {Array} labelIds - Label IDs to add
   */
  async addLabels(messageId, labelIds) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: labelIds,
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'addLabels');
    }
  }

  /**
   * Remove labels from message
   * @param {string} messageId - Message ID
   * @param {Array} labelIds - Label IDs to remove
   */
  async removeLabels(messageId, labelIds) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: labelIds,
          },
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'removeLabels');
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   */
  async markAsRead(messageId) {
    return await this.removeLabels(messageId, ['UNREAD']);
  }

  /**
   * Mark message as unread
   * @param {string} messageId - Message ID
   */
  async markAsUnread(messageId) {
    return await this.addLabels(messageId, ['UNREAD']);
  }

  /**
   * Delete message
   * @param {string} messageId - Message ID
   */
  async deleteMessage(messageId) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.gmail.users.messages.trash({
          userId: 'me',
          id: messageId,
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'deleteMessage');
    }
  }

  /**
   * Watch inbox for new messages (requires Pub/Sub setup)
   * @param {Array} labelIds - Labels to watch
   */
  async watchInbox(labelIds = ['INBOX']) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.gmail.users.watch({
          userId: 'me',
          requestBody: {
            topicName: process.env.GMAIL_WATCH_TOPIC,
            labelIds,
          },
        });
      });

      return {
        historyId: result.data.historyId,
        expiration: result.data.expiration,
      };
    } catch (error) {
      this.handleError(error, 'watchInbox');
    }
  }

  /**
   * Get history of changes since historyId
   * @param {string} startHistoryId - Starting history ID
   */
  async getHistory(startHistoryId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.gmail.users.history.list({
          userId: 'me',
          startHistoryId,
        });
      });

      return result.data.history || [];
    } catch (error) {
      this.handleError(error, 'getHistory');
    }
  }

  /**
   * Create a draft email
   * @param {object} emailParams - Email parameters
   */
  async createDraft(emailParams) {
    this.ensureInitialized();

    try {
      const message = this.createEmail(emailParams);

      const result = await this.retry(async () => {
        return await this.gmail.users.drafts.create({
          userId: 'me',
          requestBody: {
            message: {
              raw: message,
            },
          },
        });
      });

      return {
        success: true,
        draftId: result.data.id,
        messageId: result.data.message.id,
      };
    } catch (error) {
      this.handleError(error, 'createDraft');
    }
  }

  /**
   * Send existing draft
   * @param {string} draftId - Draft ID
   */
  async sendDraft(draftId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.gmail.users.drafts.send({
          userId: 'me',
          requestBody: {
            id: draftId,
          },
        });
      });

      return {
        success: true,
        messageId: result.data.id,
        threadId: result.data.threadId,
      };
    } catch (error) {
      this.handleError(error, 'sendDraft');
    }
  }
}

module.exports = GmailService;
