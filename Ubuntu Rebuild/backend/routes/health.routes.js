const router = require('express').Router();
const ctrl = require('../controllers/health.controller');

router.get('/', ctrl.basic);
router.get('/full', ctrl.full);
router.get('/jobs', (req, res) => {
  const { jobStatus } = require('../jobs/_jobWrapper');
  res.json({ jobs: jobStatus });
});

module.exports = router;
