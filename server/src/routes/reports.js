const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  listReports,
  stats,
  myReports,
  getReport,
  createReport,
  generateRti,
  rtiStatus,
  downloadRti,
  upvoteReport,
  deleteReport,
} = require('../controllers/reportController');

const router = express.Router();

router.get('/', listReports);
router.get('/stats', stats);
router.get('/my', auth, myReports);
router.get('/:id/rti-status', rtiStatus);
router.get('/:id/rti-download', downloadRti);
router.get('/:id', getReport);
router.post('/', auth, upload.array('images', 5), createReport);
router.post('/:id/generate-rti', auth, generateRti);
router.post('/:id/upvote', auth, upvoteReport);
router.delete('/:id', auth, deleteReport);

module.exports = router;

