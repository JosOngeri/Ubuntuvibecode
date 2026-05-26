const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/contractor.controller');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role(['admin','owner','manager']), ctrl.create);
router.put('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.patch('/:id', auth, role(['admin','owner','manager']), ctrl.update);
router.get('/:id/quotes', auth, ctrl.getAllQuotes);
router.post('/:id/quotes', auth, role(['admin','owner','manager']), ctrl.createQuote);
router.put('/quotes/:id', auth, role(['admin','owner','manager']), ctrl.updateQuote);
router.patch('/quotes/:id', auth, role(['admin','owner','manager']), ctrl.updateQuote);
router.get('/quotes/:quoteId/milestones', auth, ctrl.getAllMilestones);
router.post('/quotes/:quoteId/milestones', auth, role(['admin','owner','manager']), ctrl.createMilestone);
router.put('/milestones/:id', auth, role(['admin','owner','manager']), ctrl.updateMilestone);
router.patch('/milestones/:id', auth, role(['admin','owner','manager']), ctrl.updateMilestone);

module.exports = router;
