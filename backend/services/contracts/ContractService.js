/**
 * Contract Service
 * Intelligent contract generation and management using Gemini and Google Workspace
 */

const GeminiService = require('../gemini/GeminiService');
const DocsService = require('../workspace/DocsService');
const DriveService = require('../workspace/DriveService');
const CalendarService = require('../workspace/CalendarService');

class ContractService {
  constructor(db) {
    this.db = db;
    this.gemini = new GeminiService();
    this.docs = new DocsService();
    this.drive = new DriveService();
    this.calendar = new CalendarService();
    this.initialized = false;
  }

  /**
   * Initialize all services
   */
  async initialize() {
    await Promise.all([
      this.gemini.initialize(),
      this.docs.initialize(),
      this.drive.initialize(),
      this.calendar.initialize(),
    ]);

    this.initialized = true;
    return this;
  }

  /**
   * Ensure initialized
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('ContractService not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate contract from template
   * @param {object} params - Contract parameters
   */
  async generateContract(params) {
    this.ensureInitialized();

    const {
      userId,
      templateId,
      partyName,
      contractType,
      customTerms,
      effectiveDate,
      expirationDate,
      folderId,
    } = params;

    console.log(`Generating ${contractType} contract for ${partyName}...`);

    try {
      // 1. Get template from database
      const templateResult = await this.db.query(
        'SELECT * FROM contract_templates WHERE template_id = $1 AND is_active = true',
        [templateId]
      );

      if (templateResult.rows.length === 0) {
        throw new Error(`Contract template ${templateId} not found or inactive`);
      }

      const template = templateResult.rows[0];

      // 2. Copy template document in Google Drive
      const templateDocId = template.google_doc_id;
      const contractTitle = `${contractType.toUpperCase()} - ${partyName} - ${new Date().toISOString().split('T')[0]}`;

      console.log('Copying template document...');
      const newDoc = await this.docs.createFromTemplate(
        templateDocId,
        contractTitle,
        {}
      );

      // 3. Use Gemini to generate custom content
      console.log('Generating contract content with Gemini...');
      const geminiParams = {
        contractType,
        partyName,
        templateInstructions: template.gemini_instructions,
        customTerms: {
          ...template.default_terms,
          ...customTerms,
          effectiveDate,
          expirationDate,
        },
      };

      const generatedContent = await this.gemini.generateContract(geminiParams);

      // 4. Replace placeholders in document
      console.log('Updating document with generated content...');
      const replacements = {
        '{{PARTY_NAME}}': partyName,
        '{{EFFECTIVE_DATE}}': effectiveDate || new Date().toISOString().split('T')[0],
        '{{EXPIRATION_DATE}}': expirationDate || '',
        '{{GENERATED_CONTENT}}': generatedContent.text,
        ...this.buildReplacements(customTerms),
      };

      await this.docs.replacePlaceholders(newDoc.id, replacements);

      // 5. Generate contract number
      const contractNumber = await this.generateContractNumber(contractType);

      // 6. Move to contracts folder if specified
      let finalFolderId = folderId;
      if (!finalFolderId) {
        const contractsFolder = await this.drive.getOrCreateFolder('Contracts');
        finalFolderId = contractsFolder.id;
      }

      await this.drive.moveFile(newDoc.id, finalFolderId);

      // 7. Analyze contract with Gemini
      console.log('Analyzing contract...');
      const docText = await this.docs.getDocumentText(newDoc.id);
      const analysis = await this.gemini.analyzeContract(docText);

      // 8. Save contract metadata to database
      const contractData = await this.db.query(
        `INSERT INTO contracts
         (contract_number, template_id, party_name, contract_type, status, google_doc_id, google_drive_url,
          created_by, effective_date, expiration_date, terms, gemini_analysis)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          contractNumber,
          templateId,
          partyName,
          contractType,
          'draft',
          newDoc.id,
          newDoc.url,
          userId,
          effectiveDate,
          expirationDate,
          JSON.stringify(customTerms),
          JSON.stringify(analysis.analysis),
        ]
      );

      const contract = contractData.rows[0];

      // 9. Create calendar reminders for key dates
      if (expirationDate) {
        await this.createContractReminders(contract);
      }

      // 10. Log contract generation
      await this.logAudit(userId, 'contract_created', 'contract', contract.id, {
        contractNumber,
        partyName,
        contractType,
      });

      console.log(`Contract ${contractNumber} generated successfully`);

      return {
        success: true,
        contract: {
          id: contract.id,
          contractNumber: contract.contract_number,
          documentId: newDoc.id,
          documentUrl: newDoc.url,
          analysis: analysis.analysis,
          tokensUsed: generatedContent.tokensUsed,
        },
      };
    } catch (error) {
      console.error('Contract generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate unique contract number
   * @param {string} contractType - Contract type
   */
  async generateContractNumber(contractType) {
    const result = await this.db.query('SELECT generate_contract_number($1) as contract_number', [
      contractType,
    ]);
    return result.rows[0].contract_number;
  }

  /**
   * Build replacements object from custom terms
   * @param {object} customTerms - Custom terms
   */
  buildReplacements(customTerms) {
    const replacements = {};

    for (const [key, value] of Object.entries(customTerms)) {
      const placeholder = `{{${key.toUpperCase()}}}`;
      replacements[placeholder] = String(value);
    }

    return replacements;
  }

  /**
   * Create calendar reminders for contract dates
   * @param {object} contract - Contract data
   */
  async createContractReminders(contract) {
    const reminders = [];

    // Expiration reminder (30 days before)
    if (contract.expiration_date) {
      const expirationDate = new Date(contract.expiration_date);
      const reminderDate = new Date(expirationDate);
      reminderDate.setDate(reminderDate.getDate() - 30);

      if (reminderDate > new Date()) {
        const event = await this.calendar.createEvent({
          summary: `Contract Expiring: ${contract.party_name}`,
          description: `Contract ${contract.contract_number} expires in 30 days.\nReview for renewal: ${contract.google_drive_url}`,
          start: {
            dateTime: reminderDate.toISOString(),
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: new Date(reminderDate.getTime() + 3600000).toISOString(),
            timeZone: 'America/New_York',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 60 },
            ],
          },
        });

        reminders.push(event);
      }
    }

    return reminders;
  }

  /**
   * Update contract
   * @param {number} contractId - Contract ID
   * @param {object} updates - Updates
   * @param {number} userId - User ID
   */
  async updateContract(contractId, updates, userId) {
    this.ensureInitialized();

    const allowedFields = ['status', 'party_name', 'effective_date', 'expiration_date', 'terms'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(key === 'terms' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateValues.push(contractId);

    const query = `
      UPDATE contracts
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.db.query(query, updateValues);

    if (result.rows.length === 0) {
      throw new Error('Contract not found');
    }

    // Log update
    await this.logAudit(userId, 'contract_updated', 'contract', contractId, updates);

    return result.rows[0];
  }

  /**
   * Get contract by ID
   * @param {number} contractId - Contract ID
   */
  async getContract(contractId) {
    const result = await this.db.query(
      `SELECT c.*, u.name as created_by_name, u.email as created_by_email
       FROM contracts c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [contractId]
    );

    if (result.rows.length === 0) {
      throw new Error('Contract not found');
    }

    return result.rows[0];
  }

  /**
   * List contracts
   * @param {object} filters - Filter options
   */
  async listContracts(filters = {}) {
    let query = `
      SELECT c.*, u.name as created_by_name
      FROM contracts c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.contractType) {
      query += ` AND c.contract_type = $${paramIndex}`;
      params.push(filters.contractType);
      paramIndex++;
    }

    if (filters.partyName) {
      query += ` AND c.party_name ILIKE $${paramIndex}`;
      params.push(`%${filters.partyName}%`);
      paramIndex++;
    }

    if (filters.expiringWithinDays) {
      query += ` AND c.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $${paramIndex}`;
      params.push(filters.expiringWithinDays);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT ${filters.limit || 50}`;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Export contract to PDF
   * @param {number} contractId - Contract ID
   */
  async exportToPdf(contractId) {
    this.ensureInitialized();

    const contract = await this.getContract(contractId);

    // Export Google Doc to PDF
    const pdfBuffer = await this.drive.exportFile(
      contract.google_doc_id,
      'application/pdf'
    );

    // Upload PDF to Drive in same folder
    const pdfName = `${contract.contract_number}.pdf`;
    const pdfFile = await this.drive.uploadFile({
      name: pdfName,
      mimeType: 'application/pdf',
      content: pdfBuffer,
    });

    // Update contract with PDF URL
    await this.db.query('UPDATE contracts SET google_pdf_url = $1 WHERE id = $2', [
      pdfFile.url,
      contractId,
    ]);

    return {
      pdfUrl: pdfFile.url,
      downloadUrl: pdfFile.downloadUrl,
    };
  }

  /**
   * Analyze existing contract
   * @param {number} contractId - Contract ID
   * @param {string} analysisType - Analysis type
   */
  async analyzeExistingContract(contractId, analysisType = 'comprehensive') {
    this.ensureInitialized();

    const contract = await this.getContract(contractId);

    // Get document text
    const docText = await this.docs.getDocumentText(contract.google_doc_id);

    // Analyze with Gemini
    const analysis = await this.gemini.analyzeContract(docText, analysisType);

    // Update contract with new analysis
    await this.db.query(
      'UPDATE contracts SET gemini_analysis = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(analysis.analysis), contractId]
    );

    return analysis;
  }

  /**
   * Create contract version
   * @param {number} contractId - Contract ID
   * @param {string} changes - Description of changes
   * @param {number} userId - User ID
   */
  async createVersion(contractId, changes, userId) {
    this.ensureInitialized();

    const contract = await this.getContract(contractId);

    // Get current version number
    const versionResult = await this.db.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM contract_versions WHERE contract_id = $1',
      [contractId]
    );

    const nextVersion = versionResult.rows[0].next_version;

    // Copy current document
    const versionTitle = `${contract.contract_number} - v${nextVersion}`;
    const versionDoc = await this.drive.copyFile(
      contract.google_doc_id,
      versionTitle
    );

    // Save version to database
    await this.db.query(
      `INSERT INTO contract_versions (contract_id, version_number, google_doc_id, google_drive_url, changes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [contractId, nextVersion, versionDoc.id, versionDoc.url, changes, userId]
    );

    return {
      version: nextVersion,
      documentId: versionDoc.id,
      documentUrl: versionDoc.url,
    };
  }

  /**
   * Get expiring contracts
   * @param {number} days - Days ahead to check
   */
  async getExpiringContracts(days = 30) {
    const result = await this.db.query(
      `SELECT * FROM expiring_contracts WHERE days_until_expiration <= $1`,
      [days]
    );

    return result.rows;
  }

  /**
   * Log audit entry
   * @param {number} userId - User ID
   * @param {string} action - Action
   * @param {string} resourceType - Resource type
   * @param {string} resourceId - Resource ID
   * @param {object} changes - Changes
   */
  async logAudit(userId, action, resourceType, resourceId, changes = {}) {
    await this.db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, String(resourceId), JSON.stringify(changes)]
    );
  }

  /**
   * Share contract with user
   * @param {number} contractId - Contract ID
   * @param {string} email - User email
   * @param {string} role - Permission role (reader, writer, commenter)
   */
  async shareContract(contractId, email, role = 'reader') {
    this.ensureInitialized();

    const contract = await this.getContract(contractId);

    await this.drive.shareFile(contract.google_doc_id, {
      type: 'user',
      role,
      emailAddress: email,
    });

    return { success: true };
  }
}

module.exports = ContractService;
