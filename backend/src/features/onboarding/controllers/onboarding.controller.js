const logger = require('../../../../utils/logger');
const onboardingService = require('../services/onboarding.service');
const onboardingRepository = require('../repositories/onboarding.repository');

/**
 * Start onboarding process
 */
const startOnboarding = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const startedBy = req.user.id;

    const result = await onboardingService.startOnboarding(applicationId, startedBy);
    res.json(result);
  } catch (err) {
    logger.error('onboarding.controller.startOnboarding', 'Unhandled error', err);
    res.status(400).json({ msg: err.message });
  }
};

/**
 * Save onboarding step
 */
const saveStep = async (req, res) => {
  try {
    const { applicationId, stepNumber } = req.params;
    const stepData = req.body;

    let result;
    switch (parseInt(stepNumber)) {
      case 1:
        result = await onboardingService.saveStep1EmployeeProfile(applicationId, stepData);
        break;
      case 2:
        result = await onboardingService.saveStep2JobDescription(applicationId, stepData);
        break;
      case 3:
        result = await onboardingService.saveStep3AssetAllocation(applicationId, stepData.assetIds);
        break;
      case 4:
        result = await onboardingService.saveStep4UserCreation(applicationId, stepData);
        break;
      case 5:
        result = await onboardingService.saveStep5OrientationChecklist(applicationId, stepData);
        break;
      case 6:
        result = await onboardingService.saveStep6DocumentUpload(applicationId, stepData);
        break;
      default:
        throw new Error('Invalid step number');
    }

    res.json(result);
  } catch (err) {
    logger.error('onboarding.controller.saveStep', 'Unhandled error', err);
    res.status(400).json({ msg: err.message });
  }
};

/**
 * Get onboarding progress
 */
const getProgress = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const progress = await onboardingService.getOnboardingProgress(applicationId);
    res.json(progress);
  } catch (err) {
    logger.error('onboarding.controller.getProgress', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to get onboarding progress' });
  }
};

/**
 * Complete onboarding
 */
const completeOnboarding = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const result = await onboardingService.completeOnboarding(applicationId);
    res.json(result);
  } catch (err) {
    logger.error('onboarding.controller.completeOnboarding', 'Unhandled error', err);
    res.status(400).json({ msg: err.message });
  }
};

/**
 * Get all departments
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await onboardingRepository.findDepartments();
    res.json(departments);
  } catch (err) {
    logger.error('onboarding.controller.getDepartments', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to get departments' });
  }
};

/**
 * Create new department
 */
const createDepartment = async (req, res) => {
  try {
    const department = await onboardingRepository.createDepartment(req.body);
    res.json(department);
  } catch (err) {
    logger.error('onboarding.controller.createDepartment', 'Unhandled error', err);
    res.status(400).json({ msg: err.message });
  }
};

/**
 * Get potential supervisors
 */
const getPotentialSupervisors = async (req, res) => {
  try {
    const supervisors = await onboardingRepository.findPotentialSupervisors();
    res.json(supervisors);
  } catch (err) {
    logger.error('onboarding.controller.getPotentialSupervisors', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to get supervisors' });
  }
};

/**
 * Get available assets
 */
const getAvailableAssets = async (req, res) => {
  try {
    const assets = await onboardingRepository.getAvailableAssets();
    res.json(assets);
  } catch (err) {
    logger.error('onboarding.controller.getAvailableAssets', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to get available assets' });
  }
};

/**
 * Upload onboarding document
 */
const uploadDocument = async (req, res) => {
  try {
    const documentData = {
      ...req.body,
      uploadedBy: req.user.id,
    };
    const document = await onboardingService.uploadDocument(documentData);
    res.json(document);
  } catch (err) {
    logger.error('onboarding.controller.uploadDocument', 'Unhandled error', err);
    res.status(400).json({ msg: err.message });
  }
};

/**
 * Get documents for application
 */
const getApplicationDocuments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const documents = await onboardingService.getApplicationDocuments(applicationId);
    res.json(documents);
  } catch (err) {
    logger.error('onboarding.controller.getApplicationDocuments', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to get documents' });
  }
};

/**
 * Get documents for employee
 */
const getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const documents = await onboardingService.getEmployeeDocuments(employeeId);
    res.json(documents);
  } catch (err) {
    logger.error('onboarding.controller.getEmployeeDocuments', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to get documents' });
  }
};

/**
 * Delete document
 */
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await onboardingService.deleteDocument(documentId);
    res.json(document);
  } catch (err) {
    logger.error('onboarding.controller.deleteDocument', 'Unhandled error', err);
    res.status(400).json({ msg: err.message });
  }
};

/**
 * Update asset return status
 */
const updateAssetReturnStatus = async (req, res) => {
  try {
    const { assetId } = req.params;
    const returnData = {
      ...req.body,
      returnedBy: req.user.id,
    };
    const asset = await onboardingService.updateAssetReturnStatus(assetId, returnData);
    res.json(asset);
  } catch (err) {
    logger.error('onboarding.controller.updateAssetReturnStatus', 'Unhandled error', err);
    res.status(400).json({ msg: err.message });
  }
};

/**
 * Get assets pending return
 */
const getAssetsPendingReturn = async (req, res) => {
  try {
    const assets = await onboardingService.getAssetsPendingReturn();
    res.json(assets);
  } catch (err) {
    logger.error('onboarding.controller.getAssetsPendingReturn', 'Unhandled error', err);
    res.status(500).json({ msg: 'Failed to get assets pending return' });
  }
};

module.exports = {
  startOnboarding,
  saveStep,
  getProgress,
  completeOnboarding,
  getDepartments,
  createDepartment,
  getPotentialSupervisors,
  getAvailableAssets,
  uploadDocument,
  getApplicationDocuments,
  getEmployeeDocuments,
  deleteDocument,
  updateAssetReturnStatus,
  getAssetsPendingReturn,
};
