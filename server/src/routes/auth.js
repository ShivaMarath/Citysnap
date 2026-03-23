const express = require('express');
const { register, login, me, updateProfile, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', express.json(), register);
router.post('/login', express.json(), login);
router.get('/me', auth, me);
router.put('/profile', auth, express.json(), updateProfile);
router.put('/password', auth, express.json(), changePassword);

module.exports = router;

