const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  listReports,
  stats,
  myReports,
  getReport,
  createReport,
  upvoteReport,
  deleteReport,
} = require('../controllers/reportController');

const router = express.Router();

router.get('/', listReports);
router.get('/stats', stats);
router.get('/my', auth, myReports);
router.get('/:id', getReport);
router.post('/', auth, upload.array('images', 5), createReport);
router.post('/:id/upvote', auth, upvoteReport);
router.delete('/:id', auth, deleteReport);

module.exports = router;

