/**
 * Contract Controller
 * Handles contract-related API endpoints
 */

const ContractService = require('../services/contracts/ContractService');
const db = require('../config/database');

/**
 * Generate a new contract
 */
const generateContract = async (req, res) => {
  try {
    const {
      templateId,
      partyName,
      contractType,
      customTerms,
      effectiveDate,
      expirationDate,
      folderId,
    } = req.body;

    // Validate required fields
    if (!templateId || !partyName || !contractType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: templateId, partyName, contractType',
      });
    }

    const contractService = new ContractService(db);
    await contractService.initialize();

    const result = await contractService.generateContract({
      userId: req.user.id,
      templateId,
      partyName,
      contractType,
      customTerms: customTerms || {},
      effectiveDate,
      expirationDate,
      folderId,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Generate contract error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate contract',
    });
  }
};

/**
 * Get contract by ID
 */
const getContract = async (req, res) => {
  try {
    const { id } = req.params;

    const contractService = new ContractService(db);
    await contractService.initialize();

    const contract = await contractService.getContract(parseInt(id));

    res.json({
      success: true,
      contract,
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(error.message === 'Contract not found' ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * List contracts
 */
const listContracts = async (req, res) => {
  try {
    const { status, contractType, partyName, expiringWithinDays, limit } = req.query;

    const contractService = new ContractService(db);
    const contracts = await contractService.listContracts({
      status,
      contractType,
      partyName,
      expiringWithinDays: expiringWithinDays ? parseInt(expiringWithinDays) : undefined,
      limit: limit ? parseInt(limit) : 50,
    });

    res.json({
      success: true,
      contracts,
      count: contracts.length,
    });
  } catch (error) {
    console.error('List contracts error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update contract
 */
const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contractService = new ContractService(db);
    await contractService.initialize();

    const contract = await contractService.updateContract(
      parseInt(id),
      updates,
      req.user.id
    );

    res.json({
      success: true,
      contract,
    });
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Export contract to PDF
 */
const exportToPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const contractService = new ContractService(db);
    await contractService.initialize();

    const result = await contractService.exportToPdf(parseInt(id));

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Analyze contract
 */
const analyzeContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { analysisType } = req.query;

    const contractService = new ContractService(db);
    await contractService.initialize();

    const analysis = await contractService.analyzeExistingContract(
      parseInt(id),
      analysisType || 'comprehensive'
    );

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analyze contract error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create contract version
 */
const createVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { changes } = req.body;

    if (!changes) {
      return res.status(400).json({
        success: false,
        message: 'Changes description is required',
      });
    }

    const contractService = new ContractService(db);
    await contractService.initialize();

    const version = await contractService.createVersion(
      parseInt(id),
      changes,
      req.user.id
    );

    res.status(201).json({
      success: true,
      version,
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get expiring contracts
 */
const getExpiringContracts = async (req, res) => {
  try {
    const { days } = req.query;

    const contractService = new ContractService(db);
    const contracts = await contractService.getExpiringContracts(
      days ? parseInt(days) : 30
    );

    res.json({
      success: true,
      contracts,
      count: contracts.length,
    });
  } catch (error) {
    console.error('Get expiring contracts error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Share contract
 */
const shareContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const contractService = new ContractService(db);
    await contractService.initialize();

    await contractService.shareContract(parseInt(id), email, role || 'reader');

    res.json({
      success: true,
      message: 'Contract shared successfully',
    });
  } catch (error) {
    console.error('Share contract error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateContract,
  getContract,
  listContracts,
  updateContract,
  exportToPdf,
  analyzeContract,
  createVersion,
  getExpiringContracts,
  shareContract,
};
