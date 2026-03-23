const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
// Support env placed either in server root (`server/.env`) or inside `server/src/.env`.
// We load root first, then let `src/.env` override when present.
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
// Override because root `.env` may define the key as empty (e.g. `ROBOFLOW_API_KEY=`).
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const authorityRoutes = require('./routes/authority');
const usersRoutes = require('./routes/users');
const { startCronJobs } = require('./services/cronService');

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'citysnap-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/authority', authorityRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/citysnap';

async function start() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
  startCronJobs();

  app.listen(PORT, () => console.log(`Server running on :${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});

