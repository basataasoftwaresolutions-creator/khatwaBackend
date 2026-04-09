require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const path = require('path');
const { connectDB } = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
require('./models'); // Load models/associations before connecting


const app = express();

// Middleware
const corsOriginsFromEnv = (process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizeOrigin = (origin) => (origin ? origin.trim().replace(/\/$/, '') : origin);

const allowedOrigins = new Set(
  [...corsOriginsFromEnv, process.env.FRONTEND_URL].filter(Boolean).map(normalizeOrigin)
);

const isLocalhostOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin || '');
};

const isKhatwaVercelOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  return /^https:\/\/khatwa-(omega|psi)(-[a-z0-9-]+)?\.vercel\.app$/i.test(normalizedOrigin || '');
};

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!normalizedOrigin) return callback(null, true);
    if (isLocalhostOrigin(normalizedOrigin)) return callback(null, true);
    if (isKhatwaVercelOrigin(normalizedOrigin)) return callback(null, true);
    if (allowedOrigins.has(normalizedOrigin)) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
  maxAge: 86400
};

const corsMiddleware = cors(corsOptions);

app.use(corsMiddleware);
app.options(/.*/, corsMiddleware);
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate Limiting (Global)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 10 minutes' }
});
app.use(limiter);

// Prevent XSS attacks
// app.use(xss());

// Prevent HTTP Parameter Pollution
// app.use(hpp());

// Only use morgan in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database Connection
connectDB();

// Route Files
const auth = require('./routes/authRoutes');
const projects = require('./routes/projectRoutes');
const marketing = require('./routes/marketingRoutes');
const finance = require('./routes/financeRoutes');
const tasks = require('./routes/taskRoutes');
const team = require('./routes/teamRoutes');
const community = require('./routes/communityRoutes');
const subscriptions = require('./routes/subscriptionRoutes');
const ai = require('./routes/aiRoutes');
const reports = require('./routes/reportRoutes');
const analytics = require('./routes/analyticsRoutes');
const errorHandler = require('./middlewares/error');

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/projects', projects);
app.use('/api/v1', marketing); // Mount at root since it has mixed paths
app.use('/api/v1', finance);
app.use('/api/v1', tasks);
app.use('/api/v1', team);
app.use('/api/v1/community', community);
app.use('/api/v1/subscriptions', subscriptions);
app.use('/api/v1/ai', ai);
app.use('/api/v1', reports);
app.use('/api/v1/analytics', analytics);

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error Handler
app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
