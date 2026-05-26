const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/job.controller');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', auth, role(['admin','owner','manager','hr']), ctrl.create);
router.put('/:id', auth, role(['admin','owner','manager','hr']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner','manager','hr']), ctrl.update);
router.get('/:id/applications', auth, ctrl.getAllApplications);
router.get('/:id/applications/:applicationId', auth, ctrl.getApplicationById);
router.post('/:id/applications', auth, ctrl.createApplication);
router.post('/:id/score-applicants', auth, role(['admin','owner','manager','hr']), ctrl.scoreApplicants);
router.put('/:id/applications/:applicationId', auth, role(['admin','owner','manager','hr']), ctrl.updateApplication);
router.patch('/:id/applications/:applicationId', auth, role(['admin','owner','manager','hr']), ctrl.updateApplication);

module.exports = router;
