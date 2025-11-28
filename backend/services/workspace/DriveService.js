/**
 * Google Drive Service
 * Handles all Google Drive API operations
 */

const { google } = require('googleapis');
const BaseWorkspaceService = require('./BaseWorkspaceService');
const fs = require('fs');
const stream = require('stream');

class DriveService extends BaseWorkspaceService {
  constructor() {
    super(['https://www.googleapis.com/auth/drive']);
    this.drive = null;
  }

  /**
   * Initialize Drive service
   * @param {string} userEmail - User email for delegation
   */
  async initialize(userEmail = null) {
    await super.initialize(userEmail);
    const authClient = await this.auth.getClient();
    this.drive = google.drive({ version: 'v3', auth: authClient });
    return this;
  }

  /**
   * Create a folder
   * @param {string} name - Folder name
   * @param {string} parentId - Parent folder ID (optional)
   */
  async createFolder(name, parentId = null) {
    this.ensureInitialized();
    this.logApiCall('Drive', 'createFolder', { name, parentId });

    try {
      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const result = await this.retry(async () => {
        return await this.drive.files.create({
          requestBody: fileMetadata,
          fields: 'id, name, webViewLink, createdTime',
        });
      });

      return {
        id: result.data.id,
        name: result.data.name,
        url: result.data.webViewLink,
        createdTime: result.data.createdTime,
      };
    } catch (error) {
      this.handleError(error, 'createFolder');
    }
  }

  /**
   * Upload a file
   * @param {object} params - Upload parameters
   * @param {string} params.name - File name
   * @param {string} params.mimeType - MIME type
   * @param {Buffer|Stream} params.content - File content
   * @param {string} params.parentId - Parent folder ID (optional)
   */
  async uploadFile({ name, mimeType, content, parentId = null }) {
    this.ensureInitialized();
    this.logApiCall('Drive', 'uploadFile', { name, mimeType, parentId });

    try {
      const fileMetadata = { name };
      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const media = {
        mimeType,
        body: content instanceof stream.Stream ? content : stream.Readable.from([content]),
      };

      const result = await this.retry(async () => {
        return await this.drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id, name, mimeType, webViewLink, webContentLink, size, createdTime',
        });
      });

      return {
        id: result.data.id,
        name: result.data.name,
        mimeType: result.data.mimeType,
        url: result.data.webViewLink,
        downloadUrl: result.data.webContentLink,
        size: result.data.size,
        createdTime: result.data.createdTime,
      };
    } catch (error) {
      this.handleError(error, 'uploadFile');
    }
  }

  /**
   * Download a file
   * @param {string} fileId - File ID
   */
  async downloadFile(fileId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.drive.files.get(
          {
            fileId,
            alt: 'media',
          },
          { responseType: 'arraybuffer' }
        );
      });

      return Buffer.from(result.data);
    } catch (error) {
      this.handleError(error, 'downloadFile');
    }
  }

  /**
   * Get file metadata
   * @param {string} fileId - File ID
   * @param {string} fields - Fields to retrieve
   */
  async getFileMetadata(fileId, fields = '*') {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.drive.files.get({
          fileId,
          fields,
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'getFileMetadata');
    }
  }

  /**
   * List files in a folder
   * @param {string} folderId - Folder ID (optional)
   * @param {object} options - Query options
   */
  async listFiles(folderId = null, options = {}) {
    this.ensureInitialized();

    try {
      let query = options.query || '';

      if (folderId) {
        query += (query ? ' and ' : '') + `'${folderId}' in parents`;
      }

      if (!options.includeTrashed) {
        query += (query ? ' and ' : '') + 'trashed = false';
      }

      const result = await this.retry(async () => {
        return await this.drive.files.list({
          q: query,
          pageSize: options.pageSize || 100,
          fields:
            'nextPageToken, files(id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink, owners)',
          orderBy: options.orderBy || 'modifiedTime desc',
        });
      });

      return result.data.files || [];
    } catch (error) {
      this.handleError(error, 'listFiles');
    }
  }

  /**
   * Search files
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   */
  async searchFiles(query, maxResults = 50) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.drive.files.list({
          q: query,
          pageSize: maxResults,
          fields:
            'files(id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink)',
        });
      });

      return result.data.files || [];
    } catch (error) {
      this.handleError(error, 'searchFiles');
    }
  }

  /**
   * Update file metadata
   * @param {string} fileId - File ID
   * @param {object} metadata - Metadata to update
   */
  async updateFileMetadata(fileId, metadata) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.drive.files.update({
          fileId,
          requestBody: metadata,
          fields: 'id, name, modifiedTime',
        });
      });

      return result.data;
    } catch (error) {
      this.handleError(error, 'updateFileMetadata');
    }
  }

  /**
   * Delete a file
   * @param {string} fileId - File ID
   */
  async deleteFile(fileId) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.drive.files.delete({
          fileId,
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'deleteFile');
    }
  }

  /**
   * Copy a file
   * @param {string} fileId - Source file ID
   * @param {string} name - New file name
   * @param {string} parentId - Parent folder ID (optional)
   */
  async copyFile(fileId, name, parentId = null) {
    this.ensureInitialized();

    try {
      const metadata = { name };
      if (parentId) {
        metadata.parents = [parentId];
      }

      const result = await this.retry(async () => {
        return await this.drive.files.copy({
          fileId,
          requestBody: metadata,
          fields: 'id, name, webViewLink',
        });
      });

      return {
        id: result.data.id,
        name: result.data.name,
        url: result.data.webViewLink,
      };
    } catch (error) {
      this.handleError(error, 'copyFile');
    }
  }

  /**
   * Move a file to another folder
   * @param {string} fileId - File ID
   * @param {string} newParentId - New parent folder ID
   */
  async moveFile(fileId, newParentId) {
    this.ensureInitialized();

    try {
      // Get current parents
      const file = await this.getFileMetadata(fileId, 'parents');
      const previousParents = file.parents ? file.parents.join(',') : '';

      const result = await this.retry(async () => {
        return await this.drive.files.update({
          fileId,
          addParents: newParentId,
          removeParents: previousParents,
          fields: 'id, parents',
        });
      });

      return { success: true, parents: result.data.parents };
    } catch (error) {
      this.handleError(error, 'moveFile');
    }
  }

  /**
   * Share a file with permissions
   * @param {string} fileId - File ID
   * @param {object} permission - Permission object
   * @param {string} permission.role - Role (reader, writer, commenter, owner)
   * @param {string} permission.type - Type (user, group, domain, anyone)
   * @param {string} permission.emailAddress - Email address (for user/group type)
   */
  async shareFile(fileId, permission) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.drive.permissions.create({
          fileId,
          requestBody: permission,
          fields: 'id',
        });
      });

      return { success: true, permissionId: result.data.id };
    } catch (error) {
      this.handleError(error, 'shareFile');
    }
  }

  /**
   * Remove file permission
   * @param {string} fileId - File ID
   * @param {string} permissionId - Permission ID
   */
  async removePermission(fileId, permissionId) {
    this.ensureInitialized();

    try {
      await this.retry(async () => {
        return await this.drive.permissions.delete({
          fileId,
          permissionId,
        });
      });

      return { success: true };
    } catch (error) {
      this.handleError(error, 'removePermission');
    }
  }

  /**
   * List file permissions
   * @param {string} fileId - File ID
   */
  async listPermissions(fileId) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.drive.permissions.list({
          fileId,
          fields: 'permissions(id, type, role, emailAddress, displayName)',
        });
      });

      return result.data.permissions || [];
    } catch (error) {
      this.handleError(error, 'listPermissions');
    }
  }

  /**
   * Export Google Doc/Sheet/Slide to different format
   * @param {string} fileId - File ID
   * @param {string} mimeType - Export MIME type
   */
  async exportFile(fileId, mimeType) {
    this.ensureInitialized();

    try {
      const result = await this.retry(async () => {
        return await this.drive.files.export(
          {
            fileId,
            mimeType,
          },
          { responseType: 'arraybuffer' }
        );
      });

      return Buffer.from(result.data);
    } catch (error) {
      this.handleError(error, 'exportFile');
    }
  }

  /**
   * Create folder structure
   * @param {Array} folderStructure - Array of folder paths
   * @param {string} rootId - Root folder ID
   */
  async createFolderStructure(folderStructure, rootId = null) {
    const createdFolders = {};

    for (const path of folderStructure) {
      const parts = path.split('/').filter((p) => p);
      let currentParentId = rootId;

      for (let i = 0; i < parts.length; i++) {
        const folderName = parts[i];
        const folderPath = parts.slice(0, i + 1).join('/');

        if (!createdFolders[folderPath]) {
          const folder = await this.createFolder(folderName, currentParentId);
          createdFolders[folderPath] = folder.id;
        }

        currentParentId = createdFolders[folderPath];
      }
    }

    return createdFolders;
  }

  /**
   * Get folder by name
   * @param {string} folderName - Folder name
   * @param {string} parentId - Parent folder ID (optional)
   */
  async getFolderByName(folderName, parentId = null) {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;

    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const folders = await this.searchFiles(query, 1);
    return folders.length > 0 ? folders[0] : null;
  }

  /**
   * Get or create folder
   * @param {string} folderName - Folder name
   * @param {string} parentId - Parent folder ID (optional)
   */
  async getOrCreateFolder(folderName, parentId = null) {
    const existingFolder = await this.getFolderByName(folderName, parentId);

    if (existingFolder) {
      return existingFolder;
    }

    return await this.createFolder(folderName, parentId);
  }
}

module.exports = DriveService;
