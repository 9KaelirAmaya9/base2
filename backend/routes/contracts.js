/**
 * Contract Routes
 * API endpoints for contract management
 */

const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/contracts/generate
 * Generate a new contract
 */
router.post('/generate', contractController.generateContract);

/**
 * GET /api/contracts
 * List contracts with optional filters
 * Query params: status, contractType, partyName, expiringWithinDays, limit
 */
router.get('/', contractController.listContracts);

/**
 * GET /api/contracts/expiring
 * Get expiring contracts
 * Query params: days (default: 30)
 */
router.get('/expiring', contractController.getExpiringContracts);

/**
 * GET /api/contracts/:id
 * Get contract by ID
 */
router.get('/:id', contractController.getContract);

/**
 * PATCH /api/contracts/:id
 * Update contract
 */
router.patch('/:id', contractController.updateContract);

/**
 * POST /api/contracts/:id/export-pdf
 * Export contract to PDF
 */
router.post('/:id/export-pdf', contractController.exportToPdf);

/**
 * POST /api/contracts/:id/analyze
 * Analyze contract with Gemini
 * Query params: analysisType (comprehensive, risk_assessment, summary, key_dates, financial_terms)
 */
router.post('/:id/analyze', contractController.analyzeContract);

/**
 * POST /api/contracts/:id/versions
 * Create a new version of the contract
 */
router.post('/:id/versions', contractController.createVersion);

/**
 * POST /api/contracts/:id/share
 * Share contract with user
 */
router.post('/:id/share', contractController.shareContract);

module.exports = router;
