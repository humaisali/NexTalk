require('dotenv').config();
const express       = require('express');
const http          = require('http');
const cors          = require('cors');
const mongoose      = require('mongoose');
const { Server }    = require('socket.io');
const socketHandler = require('./socket/socketHandler');

const app    = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// REST Routes
// ─────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'NexTalk API is running 🚀', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

// ─────────────────────────────────────────────
// Socket.io
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout:  60000,
  pingInterval: 25000
});

app.set('io', io);
socketHandler(io);   // all real-time events wired here

// ─────────────────────────────────────────────
// MongoDB + Server Start
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 NexTalk server → http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB failed:', err.message);
    process.exit(1);
  });
