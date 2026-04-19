const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const startIoTGenerator = require('./utils/iotGenerator');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Permissive CSP for development preview
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline' data: blob:; img-src * data: blob:; font-src * data: blob:; connect-src *;");
  next();
});

// Body parser
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));

// Route files
const auth = require('./routes/auth');
const batches = require('./routes/batches');
const complaints = require('./routes/complaints');
const users = require('./routes/users');
const stats = require('./routes/stats');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/batches', batches);
app.use('/api/complaints', complaints);
app.use('/api/users', users);
app.use('/api/network-intelligence', stats);

// Serve static assets in production (for now just serve the current directory)
app.use(express.static('./'));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
    credentials: true
  }
});

// Start IoT Simulation with Socket.io
app.set('socketio', io);
startIoTGenerator(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log('Socket.io initialized');
});

// Socket connection logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('subscribeToBatch', (batchId) => {
    socket.join(batchId);
    console.log(`Client ${socket.id} subscribed to batch: ${batchId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  httpServer.close(() => process.exit(1));
});
