const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { dashboard, listReports, updateStatus, listCivilians } = require('../controllers/authorityController');

const router = express.Router();

router.use(auth, requireRole('authority'));

router.get('/dashboard', dashboard);
router.get('/reports', listReports);
router.patch('/reports/:id/status', express.json(), updateStatus);
router.get('/users', listCivilians);

module.exports = router;

