const express = require('express');
const router = express.Router();
const contractorController = require('../controllers/contractor.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', contractorController.getContractorStats);
router.get('/projects', contractorController.getContractorProjects);
router.get('/projects/recent', contractorController.getRecentProjects);
router.get('/invoices', contractorController.getContractorInvoices);
router.get('/invoices/recent', contractorController.getRecentInvoices);

router.post('/projects', contractorController.createProject);
router.put('/projects/:id', contractorController.updateProject);
router.delete('/projects/:id', contractorController.deleteProject);

router.post('/invoices', contractorController.createInvoice);
router.put('/invoices/:id', contractorController.updateInvoice);
router.delete('/invoices/:id', contractorController.deleteInvoice);

router.get('/profile', contractorController.getProfile);
router.put('/profile', contractorController.updateProfile);
router.get('/reports', contractorController.getReports);

module.exports = router;
