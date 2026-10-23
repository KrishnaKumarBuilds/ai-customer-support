import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import agentRoutes from './routes/agentRoutes';
import adminRoutes from './routes/adminRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import slaRoutes from './routes/slaRoutes';
import categoryRoutes from './routes/categoryRoutes';
import notificationRoutes from './routes/notificationRoutes';
import aiRoutes from './routes/aiRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supportiq';

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

app.use(globalLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      skip: (req) => req.url.includes('/health')
    })
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SupportIQ Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ─── MongoDB Connection & Server Start ────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[✓] MongoDB connected: ${MONGODB_URI}`);
  } catch (error) {
    console.error('[✗] MongoDB connection failed:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║    SupportIQ Backend API — v1.0.0            ║');
    console.log(`║    Running on: http://localhost:${PORT}         ║`);
    console.log('║    Environment: ' + (process.env.NODE_ENV || 'development').padEnd(29) + '║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log('[✓] Routes:');
    console.log('    /api/auth         Authentication');
    console.log('    /api/tickets      Ticket Management');
    console.log('    /api/agents       Agent Management');
    console.log('    /api/admin        Admin Dashboard & Analytics');
    console.log('    /api/feedback     CSAT & Feedback');
    console.log('    /api/sla          SLA Rules');
    console.log('    /api/categories   Categories');
    console.log('    /api/notifications Notifications');
    console.log('    /api/ai           AI Classification');
    console.log('');
  });
};

startServer();

export default app;
