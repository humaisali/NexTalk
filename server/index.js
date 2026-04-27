require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const mongoose   = require('mongoose');
const helmet     = require('helmet');
const compression = require('compression');
const morgan     = require('morgan');
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimit');
const socketHandler = require('./socket/socketHandler');

const app    = express();
const server = http.createServer(app);

// ─── Security & performance middleware ────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // handled by frontend
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl) in dev
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Rate limiting ────────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai',   aiLimiter);

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/conversations', require('./routes/conversations'));

// Health check (used by Render)
app.get('/', (req, res) => res.json({
  status: 'NexTalk API running 🚀',
  version: '1.0.0',
  env: process.env.NODE_ENV || 'development'
}));

// ─── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error.' });
});

// ─── Socket.io ────────────────────────────────────────────────────
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout:  60000,
  pingInterval: 25000,
  transports:   ['websocket', 'polling']
});

app.set('io', io);
socketHandler(io);

// ─── MongoDB + Server start ────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 NexTalk server on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Graceful shutdown ────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    await mongoose.connection.close(false);
    console.log('✅ Server and DB closed cleanly');
    process.exit(0);
  });
  // Force kill after 10s
  setTimeout(() => { console.error('⚠️ Forced shutdown'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled rejections — log, don't crash
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});
