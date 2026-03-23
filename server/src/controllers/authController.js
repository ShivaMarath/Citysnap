const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret) {
    const err = new Error('JWT_SECRET is not set');
    err.statusCode = 500;
    throw err;
  }
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  return jwt.sign({ id: user._id }, secret, { expiresIn });
}

async function register(req, res) {
  try {
    const { name, email, password, ward, city, phone } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      password,
      role: 'civilian',
      ward: ward || '',
      city: city || '',
      phone: phone || '',
    });

    const token = signToken(user);
    const safe = await User.findById(user._id).select('-password');
    res.status(201).json({ token, user: safe });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user || !user.isActive) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    const safe = await User.findById(user._id).select('-password');
    res.json({ token, user: safe });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || 'Login failed' });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const { name, ward, city, phone, avatar } = req.body || {};
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof ward === 'string') user.ward = ward.trim();
  if (typeof city === 'string') user.city = city.trim();
  if (typeof phone === 'string') user.phone = phone.trim();
  if (typeof avatar === 'string') user.avatar = avatar.trim();

  await user.save();
  const safe = await User.findById(user._id).select('-password');
  res.json({ user: safe });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing password fields' });

  const user = await User.findById(req.user._id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();
  res.json({ ok: true });
}

module.exports = { register, login, me, updateProfile, changePassword };

