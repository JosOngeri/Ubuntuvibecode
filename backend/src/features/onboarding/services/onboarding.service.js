const logger = require('../../../../utils/logger');
const onboardingRepository = require('../repositories/onboarding.repository');
const JobApplication = require('../../../../models/JobApplication.model');
const Employee = require('../../../../models/Employee.model');
const User = require('../../../../models/User.model');
const { sendEmail } = require('../../../../utils/email');
const { sendSMS, normalizePhoneNumber } = require('../../../../utils/sms');

const onboardingService = {
  /**
   * Start onboarding process for a job application
   */
  async startOnboarding(applicationId, startedBy) {
    try {
      const application = await JobApplication.findById(applicationId);
      if (!application) {
        throw new Error('Job application not found');
      }

      if (application.status !== 'hired') {
        throw new Error('Onboarding can only be started for hired applicants');
      }

      const onboarding = await onboardingRepository.findByApplicationId(applicationId);
      if (onboarding && onboarding.onboardingStatus === 'in_progress') {
        // Resume existing onboarding
        return onboarding;
      }

      const result = await onboardingRepository.updateOnboardingStatus(
        applicationId,
        'in_progress',
        1,
        { startedBy }
      );

      // Send email notification
      if (application.applicantEmail) {
        await sendEmail({
          to: application.applicantEmail,
          subject: 'Welcome to the Team - Onboarding Started',
          text: `Dear ${application.applicantName},\n\nWe are pleased to inform you that your onboarding process has started. Please complete the onboarding steps at your earliest convenience.\n\nWelcome aboard!`,
          html: `<h2>Welcome to the Team!</h2><p>Dear ${application.applicantName},</p><p>We are pleased to inform you that your onboarding process has started. Please complete the onboarding steps at your earliest convenience.</p><p>Welcome aboard!</p>`,
        });
      }

      // Send SMS notification
      if (application.applicantPhone) {
        const normalizedPhone = normalizePhoneNumber(application.applicantPhone);
        if (normalizedPhone) {
          await sendSMS({
            phone: normalizedPhone,
            message: `Welcome to the team! Your onboarding process has started. Please complete the onboarding steps at your earliest convenience. Welcome aboard!`,
          });
        }
      }

      logger.info('onboarding.service.startOnboarding', `Onboarding started for application ${applicationId}`);
      return result;
    } catch (error) {
      logger.error('onboarding.service.startOnboarding', 'Failed to start onboarding', error);
      throw error;
    }
  },

  /**
   * Save Step 1: Employee Profile
   */
  async saveStep1EmployeeProfile(applicationId, profileData) {
    try {
      const application = await JobApplication.findById(applicationId);
      if (!application) {
        throw new Error('Job application not found');
      }

      // Create employee from profile data
      const employee = new Employee({
        ...profileData,
        status: 'active',
        dateJoined: new Date(),
      });

      await employee.save();

      // Link employee to job application
      await JobApplication.update(applicationId, { employee_id: employee.id });

      // Update onboarding progress
      const onboardingData = {
        step1: {
          employeeId: employee.id,
          ...profileData,
        },
      };

      const result = await onboardingRepository.updateOnboardingStatus(
        applicationId,
        'in_progress',
        2,
        onboardingData
      );

      logger.info('onboarding.service.saveStep1EmployeeProfile', `Employee profile created for application ${applicationId}`);
      return { employee, onboarding: result };
    } catch (error) {
      logger.error('onboarding.service.saveStep1EmployeeProfile', 'Failed to save employee profile', error);
      throw error;
    }
  },

  /**
   * Save Step 2: Job Description (department, supervisor, schedule)
   */
  async saveStep2JobDescription(applicationId, jobData) {
    try {
      const onboarding = await onboardingRepository.findByApplicationId(applicationId);
      if (!onboarding || !onboarding.onboardingData?.step1?.employeeId) {
        throw new Error('Employee profile must be completed first');
      }

      const employeeId = onboarding.onboardingData.step1.employeeId;

      // Update employee with department and supervisor
      const employee = await Employee.findById(employeeId);
      if (employee) {
        employee.set({
          department: jobData.department,
        });
        await employee.save();
      }

      // Save employee schedule
      if (jobData.schedule) {
        await onboardingRepository.saveSchedule(employeeId, jobData.schedule);
      }

      // Update onboarding progress
      const currentData = onboarding.onboardingData || {};
      const updatedData = {
        ...currentData,
        step2: jobData,
      };

      const result = await onboardingRepository.updateOnboardingStatus(
        applicationId,
        'in_progress',
        3,
        updatedData
      );

      logger.info('onboarding.service.saveStep2JobDescription', `Job description saved for application ${applicationId}`);
      return result;
    } catch (error) {
      logger.error('onboarding.service.saveStep2JobDescription', 'Failed to save job description', error);
      throw error;
    }
  },

  /**
   * Save Step 3: Asset Allocation
   */
  async saveStep3AssetAllocation(applicationId, assetIds) {
    try {
      const onboarding = await onboardingRepository.findByApplicationId(applicationId);
      if (!onboarding || !onboarding.onboardingData?.step1?.employeeId) {
        throw new Error('Employee profile must be completed first');
      }

      const employeeId = onboarding.onboardingData.step1.employeeId;

      // Assign assets to employee
      const assignedAssets = await onboardingRepository.assignAssetsToEmployee(employeeId, assetIds);

      // Update onboarding progress
      const currentData = onboarding.onboardingData || {};
      const updatedData = {
        ...currentData,
        step3: {
          assetIds,
          assignedAssets,
        },
      };

      const result = await onboardingRepository.updateOnboardingStatus(
        applicationId,
        'in_progress',
        4,
        updatedData
      );

      logger.info('onboarding.service.saveStep3AssetAllocation', `Assets assigned for application ${applicationId}`);
      return result;
    } catch (error) {
      logger.error('onboarding.service.saveStep3AssetAllocation', 'Failed to assign assets', error);
      throw error;
    }
  },

  /**
   * Save Step 4: System User Creation
   */
  async saveStep4UserCreation(applicationId, userData) {
    try {
      const onboarding = await onboardingRepository.findByApplicationId(applicationId);
      if (!onboarding || !onboarding.onboardingData?.step1?.employeeId) {
        throw new Error('Employee profile must be completed first');
      }

      const employeeId = onboarding.onboardingData.step1.employeeId;

      // Create user account
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password, // Should be hashed by middleware
        role: userData.role || 'employee',
        status: 'active',
        mustChangePassword: true,
      });

      await user.save();

      // Link user to employee
      const employee = await Employee.findById(employeeId);
      if (employee) {
        employee.set({ userId: user.id });
        await employee.save();
      }

      // Update onboarding progress
      const currentData = onboarding.onboardingData || {};
      const updatedData = {
        ...currentData,
        step4: {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };

      const result = await onboardingRepository.updateOnboardingStatus(
        applicationId,
        'in_progress',
        5,
        updatedData
      );

      logger.info('onboarding.service.saveStep4UserCreation', `User created for application ${applicationId}`);
      return result;
    } catch (error) {
      logger.error('onboarding.service.saveStep4UserCreation', 'Failed to create user', error);
      throw error;
    }
  },

  /**
   * Save Step 5: Orientation Checklist
   */
  async saveStep5OrientationChecklist(applicationId, checklistData) {
    try {
      const onboarding = await onboardingRepository.findByApplicationId(applicationId);
      if (!onboarding || !onboarding.onboardingData?.step1?.employeeId) {
        throw new Error('Employee profile must be completed first');
      }

      const employeeId = onboarding.onboardingData.step1.employeeId;
      const departmentId = onboarding.onboardingData?.step2?.departmentId || null;

      // Get department-specific template if available, otherwise default
      const template = await onboardingRepository.findOrientationTemplate(
        checklistData.templateId,
        departmentId
      );

      // Save orientation progress
      await onboardingRepository.updateOrientationProgress(
        employeeId,
        template.id,
        checklistData.completedItems || [],
        checklistData.notes || {}
      );

      // Update onboarding progress
      const currentData = onboarding.onboardingData || {};
      const updatedData = {
        ...currentData,
        step5: checklistData,
      };

      const result = await onboardingRepository.updateOnboardingStatus(
        applicationId,
        'in_progress',
        5,
        updatedData
      );

      logger.info('onboarding.service.saveStep5OrientationChecklist', `Orientation checklist saved for application ${applicationId}`);
      return result;
    } catch (error) {
      logger.error('onboarding.service.saveStep5OrientationChecklist', 'Failed to save orientation checklist', error);
      throw error;
    }
  },

  /**
   * Save Step 6: Document Upload
   */
  async saveStep6DocumentUpload(applicationId, documentData) {
    try {
      const onboarding = await onboardingRepository.findByApplicationId(applicationId);
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      // Save document metadata to onboarding data
      const result = await onboardingRepository.updateOnboardingStatus(
        applicationId,
        'in_progress',
        6,
        {
          ...(onboarding.onboardingData || {}),
          step6: documentData,
        }
      );

      logger.info('onboarding.service.saveStep6DocumentUpload', `Document upload step saved for application ${applicationId}`);
      return result;
    } catch (error) {
      logger.error('onboarding.service.saveStep6DocumentUpload', 'Failed to save document upload step', error);
      throw error;
    }
  },

  /**
   * Complete onboarding process
   */
  async completeOnboarding(applicationId) {
    try {
      const application = await JobApplication.findById(applicationId);
      const result = await onboardingRepository.completeOnboarding(applicationId);

      // Send email notification
      if (application && application.applicantEmail) {
        await sendEmail({
          to: application.applicantEmail,
          subject: 'Onboarding Completed - Welcome to the Team!',
          text: `Dear ${application.applicantName},\n\nCongratulations! Your onboarding process has been completed successfully. You are now officially part of our team.\n\nWe look forward to working with you!`,
          html: `<h2>Onboarding Completed!</h2><p>Dear ${application.applicantName},</p><p>Congratulations! Your onboarding process has been completed successfully. You are now officially part of our team.</p><p>We look forward to working with you!</p>`,
        });
      }

      // Send SMS notification
      if (application && application.applicantPhone) {
        const normalizedPhone = normalizePhoneNumber(application.applicantPhone);
        if (normalizedPhone) {
          await sendSMS({
            phone: normalizedPhone,
            message: `Congratulations! Your onboarding is complete. You are now officially part of our team. We look forward to working with you!`,
          });
        }
      }

      logger.info('onboarding.service.completeOnboarding', `Onboarding completed for application ${applicationId}`);
      return result;
    } catch (error) {
      logger.error('onboarding.service.completeOnboarding', 'Failed to complete onboarding', error);
      throw error;
    }
  },

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(applicationId) {
    try {
      const onboarding = await onboardingRepository.findByApplicationId(applicationId);
      if (!onboarding) {
        return {
          status: 'not_started',
          step: 0,
          data: {},
        };
      }
      return {
        status: onboarding.onboardingStatus,
        step: onboarding.onboardingStep,
        data: onboarding.onboardingData,
        startedAt: onboarding.onboardingStartedAt,
        completedAt: onboarding.onboardingCompletedAt,
      };
    } catch (error) {
      logger.error('onboarding.service.getOnboardingProgress', 'Failed to get onboarding progress', error);
      throw error;
    }
  },

  /**
   * Upload onboarding document
   */
  async uploadDocument(documentData) {
    try {
      const document = await onboardingRepository.saveDocument(documentData);
      logger.info('onboarding.service.uploadDocument', `Document uploaded: ${document.id}`);
      return document;
    } catch (error) {
      logger.error('onboarding.service.uploadDocument', 'Failed to upload document', error);
      throw error;
    }
  },

  /**
   * Get documents for application
   */
  async getApplicationDocuments(applicationId) {
    try {
      const documents = await onboardingRepository.getDocumentsByApplicationId(applicationId);
      return documents;
    } catch (error) {
      logger.error('onboarding.service.getApplicationDocuments', 'Failed to get documents', error);
      throw error;
    }
  },

  /**
   * Get documents for employee
   */
  async getEmployeeDocuments(employeeId) {
    try {
      const documents = await onboardingRepository.getDocumentsByEmployeeId(employeeId);
      return documents;
    } catch (error) {
      logger.error('onboarding.service.getEmployeeDocuments', 'Failed to get documents', error);
      throw error;
    }
  },

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    try {
      const document = await onboardingRepository.deleteDocument(documentId);
      logger.info('onboarding.service.deleteDocument', `Document deleted: ${documentId}`);
      return document;
    } catch (error) {
      logger.error('onboarding.service.deleteDocument', 'Failed to delete document', error);
      throw error;
    }
  },

  /**
   * Update asset return status
   */
  async updateAssetReturnStatus(assetId, returnData) {
    try {
      const asset = await onboardingRepository.updateAssetReturnStatus(assetId, returnData);
      logger.info('onboarding.service.updateAssetReturnStatus', `Asset return status updated: ${assetId}`);
      return asset;
    } catch (error) {
      logger.error('onboarding.service.updateAssetReturnStatus', 'Failed to update asset return status', error);
      throw error;
    }
  },

  /**
   * Get assets pending return
   */
  async getAssetsPendingReturn() {
    try {
      const assets = await onboardingRepository.getAssetsPendingReturn();
      return assets;
    } catch (error) {
      logger.error('onboarding.service.getAssetsPendingReturn', 'Failed to get assets pending return', error);
      throw error;
    }
  },
};

module.exports = onboardingService;
