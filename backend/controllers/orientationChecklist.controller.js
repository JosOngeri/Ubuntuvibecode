const OrientationChecklist = require('../models/OrientationChecklist.model');
const logger = require('../utils/logger');

const DEFAULT_CHECKLIST = [
  { name: 'Complete employment contract', completed: false },
  { name: 'Submit national ID copy', completed: false },
  { name: 'Submit KRA PIN certificate', completed: false },
  { name: 'Submit NSSF card', completed: false },
  { name: 'Submit NHIF card', completed: false },
  { name: 'Submit academic certificates', completed: false },
  { name: 'Submit professional certificates', completed: false },
  { name: 'Bank account details for salary', completed: false },
  { name: 'Emergency contact information', completed: false },
  { name: 'Company policies review', completed: false },
  { name: 'IT system access setup', completed: false },
  { name: 'Workspace allocation', completed: false },
  { name: 'Uniform/Equipment issuance', completed: false },
  { name: 'Health and safety training', completed: false },
  { name: 'Introduction to team members', completed: false },
];

const orientationChecklistController = {
  async create(req, res) {
    try {
      const { role, checklist, isDefault } = req.body;
      const created = await OrientationChecklist.create({
        role,
        checklist: checklist || DEFAULT_CHECKLIST,
        isDefault: isDefault || false,
        createdBy: req.user?.id,
      });
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to create checklist', error: err.message });
    }
  },

  async getByRole(req, res) {
    try {
      const { role } = req.params;
      const checklists = await OrientationChecklist.findByRole(role);
      
      // If no role-specific checklist, return default
      if (!checklists || checklists.length === 0) {
        const defaultChecklist = await OrientationChecklist.getDefault();
        if (defaultChecklist) {
          return res.json(defaultChecklist);
        }
        return res.json({ role, checklist: DEFAULT_CHECKLIST, is_default: true });
      }
      
      res.json(checklists[0]);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch checklist', error: err.message });
    }
  },

  async getAll(req, res) {
    try {
      const checklists = await OrientationChecklist.getAll();
      res.json(checklists);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch checklists', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const checklist = await OrientationChecklist.findById(req.params.id);
      if (!checklist) return res.status(404).json({ msg: 'Checklist not found' });
      res.json(checklist);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch checklist', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { role, checklist, isDefault } = req.body;
      const updated = await OrientationChecklist.update(req.params.id, {
        role,
        checklist,
        isDefault,
      });
      if (!updated) return res.status(404).json({ msg: 'Checklist not found' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to update checklist', error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await OrientationChecklist.delete(req.params.id);
      if (!deleted) return res.status(404).json({ msg: 'Checklist not found' });
      res.json({ msg: 'Checklist deleted' });
    } catch (err) {
      res.status(500).json({ msg: 'Failed to delete checklist', error: err.message });
    }
  },
};

module.exports = orientationChecklistController;
