/**
 * Base Google Workspace Service
 * Provides common functionality for all Google Workspace services
 */

const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

class BaseWorkspaceService {
  constructor(scopes = []) {
    this.scopes = scopes;
    this.auth = null;
    this.initialized = false;
  }

  /**
   * Initialize the service with authentication
   * Supports both service account and OAuth2 user delegation
   */
  async initialize(userEmail = null) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Production: Use service account with domain-wide delegation
        this.auth = await this.createServiceAccountAuth(userEmail);
      } else {
        // Development: Use service account or OAuth2
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
          this.auth = await this.createServiceAccountAuth(userEmail);
        } else {
          throw new Error(
            'GOOGLE_SERVICE_ACCOUNT_KEY_PATH not configured. Please set up service account credentials.'
          );
        }
      }

      this.initialized = true;
      return this.auth;
    } catch (error) {
      console.error('Failed to initialize workspace service:', error.message);
      throw error;
    }
  }

  /**
   * Create service account authentication
   * @param {string} userEmail - Email for domain-wide delegation
   */
  async createServiceAccountAuth(userEmail = null) {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

    if (!keyPath) {
      throw new Error('Service account key path not configured');
    }

    // Check if key file exists
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Service account key file not found: ${keyPath}`);
    }

    const auth = new GoogleAuth({
      keyFile: keyPath,
      scopes: this.scopes,
      subject: userEmail || process.env.GOOGLE_ADMIN_EMAIL,
    });

    return auth;
  }

  /**
   * Create OAuth2 client for user-specific operations
   * @param {object} tokens - Access and refresh tokens
   */
  createOAuth2Client(tokens) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);

    return oauth2Client;
  }

  /**
   * Refresh access token if expired
   * @param {object} db - Database instance
   * @param {number} userId - User ID
   */
  async refreshAccessToken(db, userId) {
    try {
      // Get current token from database
      const result = await db.query(
        'SELECT * FROM workspace_tokens WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('No workspace token found for user');
      }

      const tokenData = result.rows[0];
      const expiresAt = new Date(tokenData.expires_at);

      // Check if token is expired or expires within 5 minutes
      if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
        return tokenData.access_token;
      }

      // Token expired, refresh it
      const oauth2Client = this.createOAuth2Client({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update database with new token
      await db.query(
        `UPDATE workspace_tokens
         SET access_token = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3`,
        [
          credentials.access_token,
          new Date(credentials.expiry_date),
          userId,
        ]
      );

      return credentials.access_token;
    } catch (error) {
      console.error('Failed to refresh access token:', error.message);
      throw error;
    }
  }

  /**
   * Store workspace tokens in database
   * @param {object} db - Database instance
   * @param {number} userId - User ID
   * @param {object} tokens - OAuth2 tokens
   * @param {string} scope - OAuth2 scope
   */
  async storeTokens(db, userId, tokens, scope) {
    try {
      await db.query(
        `INSERT INTO workspace_tokens (user_id, access_token, refresh_token, expires_at, scope)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id)
         DO UPDATE SET
           access_token = $2,
           refresh_token = COALESCE($3, workspace_tokens.refresh_token),
           expires_at = $4,
           scope = $5,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          tokens.access_token,
          tokens.refresh_token,
          new Date(tokens.expiry_date),
          scope,
        ]
      );
    } catch (error) {
      console.error('Failed to store workspace tokens:', error.message);
      throw error;
    }
  }

  /**
   * Handle API errors gracefully
   * @param {Error} error - Error object
   * @param {string} operation - Operation name
   */
  handleError(error, operation) {
    console.error(`Error in ${operation}:`, error.message);

    // Extract meaningful error message
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error?.message || error.message;
    }

    // Check for specific error types
    if (statusCode === 401) {
      throw new Error('Authentication failed. Please reconnect your Google account.');
    } else if (statusCode === 403) {
      throw new Error('Permission denied. Please check your Google Workspace permissions.');
    } else if (statusCode === 404) {
      throw new Error('Resource not found in Google Workspace.');
    } else if (statusCode === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(`${operation} failed: ${errorMessage}`);
  }

  /**
   * Retry mechanism for API calls
   * @param {Function} operation - Async function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delay - Delay between retries (ms)
   */
  async retry(operation, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on authentication or permission errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }

        // Don't retry on client errors (4xx except 429)
        if (
          error.response?.status >= 400 &&
          error.response?.status < 500 &&
          error.response?.status !== 429
        ) {
          throw error;
        }

        if (attempt < maxRetries) {
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
          await this.sleep(delay);
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate initialization
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
  }

  /**
   * Log API call for monitoring
   * @param {string} service - Service name
   * @param {string} method - Method name
   * @param {object} params - Request parameters
   */
  logApiCall(service, method, params = {}) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[${service}] ${method}`, JSON.stringify(params, null, 2));
    }
  }
}

module.exports = BaseWorkspaceService;
