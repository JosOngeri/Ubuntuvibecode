const { query } = require('../../../../config/db');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const onboardingRepository = {
  /**
   * Get onboarding data for a job application
   */
  async findByApplicationId(applicationId) {
    const { rows } = await query(
      `SELECT 
        id,
        onboarding_status AS "onboardingStatus",
        onboarding_step AS "onboardingStep",
        onboarding_data AS "onboardingData",
        onboarding_started_at AS "onboardingStartedAt",
        onboarding_completed_at AS "onboardingCompletedAt",
        onboarding_started_by AS "onboardingStartedBy"
       FROM job_applications 
       WHERE id = $1`,
      [applicationId]
    );
    return rows[0];
  },

  /**
   * Update onboarding status and progress
   */
  async updateOnboardingStatus(applicationId, status, step, data) {
    const { rows } = await query(
      `UPDATE job_applications 
       SET onboarding_status = $1,
           onboarding_step = $2,
           onboarding_data = COALESCE($3, onboarding_data),
           onboarding_started_at = COALESCE(onboarding_started_at, NOW()),
           updated_at = NOW()
       WHERE id = $4
       RETURNING 
         id,
         onboarding_status AS "onboardingStatus",
         onboarding_step AS "onboardingStep",
         onboarding_data AS "onboardingData",
         onboarding_started_at AS "onboardingStartedAt",
         onboarding_completed_at AS "onboardingCompletedAt",
         onboarding_started_by AS "onboardingStartedBy"`,
      [status, step, data ? toJsonb(data) : null, applicationId]
    );
    return rows[0];
  },

  /**
   * Mark onboarding as complete
   */
  async completeOnboarding(applicationId) {
    const { rows } = await query(
      `UPDATE job_applications 
       SET onboarding_status = 'completed',
           onboarding_step = 5,
           onboarding_completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING 
         id,
         onboarding_status AS "onboardingStatus",
         onboarding_step AS "onboardingStep",
         onboarding_data AS "onboardingData",
         onboarding_started_at AS "onboardingStartedAt",
         onboarding_completed_at AS "onboardingCompletedAt",
         onboarding_started_by AS "onboardingStartedBy"`,
      [applicationId]
    );
    return rows[0];
  },

  /**
   * Get all departments
   */
  async findDepartments() {
    const { rows } = await query(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.manager_id AS "managerId",
        e.first_name || ' ' || e.last_name AS "managerName"
       FROM departments d
       LEFT JOIN employees e ON d.manager_id = e.id
       ORDER BY d.name`
    );
    return rows;
  },

  /**
   * Create new department
   */
  async createDepartment(data) {
    const { name, description, managerId } = data;
    const { rows } = await query(
      `INSERT INTO departments (name, description, manager_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, managerId]
    );
    return rows[0];
  },

  /**
   * Get potential supervisors (employees with manager/supervisor roles)
   */
  async findPotentialSupervisors() {
    const { rows } = await query(
      `SELECT 
        e.id,
        e.first_name || ' ' || e.last_name AS name,
        e.email,
        e.department,
        u.role
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE u.role IN ('admin', 'manager', 'supervisor', 'hr')
       AND e.status = 'active'
       ORDER BY e.first_name, e.last_name`
    );
    return rows;
  },

  /**
   * Get employee schedule
   */
  async findScheduleByEmployeeId(employeeId) {
    const { rows } = await query(
      `SELECT * FROM employee_schedules WHERE employee_id = $1`,
      [employeeId]
    );
    return rows[0];
  },

  /**
   * Save employee schedule
   */
  async saveSchedule(employeeId, scheduleData) {
    const { workDays, startTime, endTime, breakDurationMinutes, canSelfCheckin } = scheduleData;
    const { rows } = await query(
      `INSERT INTO employee_schedules 
       (employee_id, work_days, start_time, end_time, break_duration_minutes, can_self_checkin)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id) 
       DO UPDATE SET
         work_days = EXCLUDED.work_days,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         break_duration_minutes = EXCLUDED.break_duration_minutes,
         can_self_checkin = EXCLUDED.can_self_checkin,
         updated_at = NOW()
       RETURNING *`,
      [
        employeeId,
        toJsonb(workDays, '[1,2,3,4,5]'),
        startTime || '09:00:00',
        endTime || '17:00:00',
        breakDurationMinutes || 60,
        canSelfCheckin || false,
      ]
    );
    return rows[0];
  },

  /**
   * Get orientation checklist template
   * @param {number} templateId - Specific template ID (optional)
   * @param {number} departmentId - Department ID to get department-specific template (optional)
   */
  async findOrientationTemplate(templateId = null, departmentId = null) {
    let sql = 'SELECT * FROM orientation_checklist_templates';
    const params = [];

    if (templateId) {
      sql += ' WHERE id = $1';
      params.push(templateId);
    } else if (departmentId) {
      // First try to find department-specific template
      sql += ' WHERE department_id = $1';
      params.push(departmentId);
      const { rows } = await query(sql, params);
      if (rows.length > 0) {
        return rows[0];
      }
      // Fall back to default template if no department-specific one exists
      sql = 'SELECT * FROM orientation_checklist_templates WHERE is_default = true';
      params.length = 0;
    } else {
      sql += ' WHERE is_default = true';
    }

    sql += ' LIMIT 1';

    const { rows } = await query(sql, params);
    return rows[0];
  },

  /**
   * Get orientation progress for employee
   */
  async findOrientationProgress(employeeId) {
    const { rows } = await query(
      `SELECT 
        ocp.id,
        ocp.employee_id AS "employeeId",
        ocp.template_id AS "templateId",
        ocp.completed_items AS "completedItems",
        ocp.notes,
        ocp.started_at AS "startedAt",
        ocp.completed_at AS "completedAt",
        oct.items AS "templateItems",
        oct.name AS "templateName"
       FROM orientation_checklist_progress ocp
       LEFT JOIN orientation_checklist_templates oct ON ocp.template_id = oct.id
       WHERE ocp.employee_id = $1`,
      [employeeId]
    );
    return rows[0];
  },

  /**
   * Update orientation progress
   */
  async updateOrientationProgress(employeeId, templateId, completedItems, notes) {
    const { rows } = await query(
      `INSERT INTO orientation_checklist_progress 
       (employee_id, template_id, completed_items, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (employee_id) 
       DO UPDATE SET
         completed_items = EXCLUDED.completed_items,
         notes = EXCLUDED.notes,
         completed_at = CASE WHEN EXCLUDED.completed_items IS NOT NULL THEN NOW() ELSE NULL END
       RETURNING *`,
      [employeeId, templateId, toJsonb(completedItems, '[]'), toJsonb(notes, '{}')]
    );
    return rows[0];
  },

  /**
   * Assign assets to employee
   */
  async assignAssetsToEmployee(employeeId, assetIds) {
    if (!assetIds || assetIds.length === 0) return [];

    const { rows } = await query(
      `UPDATE assets 
       SET assigned_to = $1,
           assigned_date = NOW(),
           status = 'assigned',
           updated_at = NOW()
       WHERE id = ANY($2)
       RETURNING *`,
      [employeeId, assetIds]
    );
    return rows;
  },

  /**
   * Get assets assigned to employee
   */
  async getEmployeeAssets(employeeId) {
    const { rows } = await query(
      `SELECT * FROM assets WHERE assigned_to = $1 ORDER BY assigned_date DESC`,
      [employeeId]
    );
    return rows;
  },

  /**
   * Get available assets
   */
  async getAvailableAssets() {
    const { rows } = await query(
      `SELECT * FROM assets WHERE status = 'available' ORDER BY name`
    );
    return rows;
  },

  /**
   * Save onboarding document
   */
  async saveDocument(documentData) {
    const { rows } = await query(
      `INSERT INTO onboarding_documents
       (application_id, employee_id, document_type, document_name, file_url, file_size, mime_type, uploaded_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        documentData.applicationId || null,
        documentData.employeeId || null,
        documentData.documentType,
        documentData.documentName,
        documentData.fileUrl,
        documentData.fileSize || null,
        documentData.mimeType || null,
        documentData.uploadedBy || null,
        documentData.notes || null,
      ]
    );
    return rows[0];
  },

  /**
   * Get documents for application
   */
  async getDocumentsByApplicationId(applicationId) {
    const { rows } = await query(
      `SELECT * FROM onboarding_documents WHERE application_id = $1 ORDER BY uploaded_at DESC`,
      [applicationId]
    );
    return rows;
  },

  /**
   * Get documents for employee
   */
  async getDocumentsByEmployeeId(employeeId) {
    const { rows } = await query(
      `SELECT * FROM onboarding_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC`,
      [employeeId]
    );
    return rows;
  },

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    const { rows } = await query(
      `DELETE FROM onboarding_documents WHERE id = $1 RETURNING *`,
      [documentId]
    );
    return rows[0];
  },

  /**
   * Update asset return status
   */
  async updateAssetReturnStatus(assetId, returnData) {
    const { rows } = await query(
      `UPDATE assets
       SET return_status = $1,
           return_date = $2,
           return_condition = $3,
           return_notes = $4,
           returned_by = $5
       WHERE id = $6
       RETURNING *`,
      [
        returnData.returnStatus,
        returnData.returnDate || null,
        returnData.returnCondition || null,
        returnData.returnNotes || null,
        returnData.returnedBy || null,
        assetId,
      ]
    );
    return rows[0];
  },

  /**
   * Get assets pending return
   */
  async getAssetsPendingReturn() {
    const { rows } = await query(
      `SELECT a.*, e.first_name, e.last_name, e.email
       FROM assets a
       LEFT JOIN employees e ON a.assigned_to = e.id
       WHERE a.return_status IN ('not_returned', 'pending_return')
       ORDER BY a.assigned_date DESC`
    );
    return rows;
  },
};

module.exports = onboardingRepository;
