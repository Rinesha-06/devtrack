import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import teamRoutes from './routes/teamRoutes';
import sprintRoutes from './routes/sprintRoutes';
import storyRoutes from './routes/storyRoutes';
import taskRoutes from './routes/taskRoutes';
import bugRoutes from './routes/bugRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import githubRoutes from './routes/githubRoutes';
import cicdRoutes from './routes/cicdRoutes';
import { db } from './repositories/firestoreRepository';
import { seedDemoData } from './utils/seedData';
import { isConnectedToGCP, projectId } from './config/firestore';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security & Logging
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts and assets for React frontend SPA
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check endpoint (for Cloud Run and container probes)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'devtrack-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gcp: {
      projectId,
      firestoreConnected: isConnectedToGCP
    }
  });
});

// Seed endpoint for resetting or demoing
app.post('/api/seed', async (req: Request, res: Response) => {
  try {
    await seedDemoData();
    res.status(200).json({ success: true, message: 'Demo data seeded successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to seed demo data', error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/cicd', cicdRoutes);

// Static frontend serving if built
const candidatePaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, 'public'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'public'),
  '/frontend/dist',
  '/app/public',
  '/app/frontend/dist'
];

const frontendDistPath = candidatePaths.find(p => fs.existsSync(path.join(p, 'index.html')));

if (frontendDistPath) {
  console.log(`[DevTrack] Serving static frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.warn('[DevTrack] Frontend static files not found in candidate paths:', candidatePaths);
}

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred.',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Auto-seed if database is empty on start
async function startServer() {
  try {
    const existingUsers = await db.list('users');
    if (existingUsers.length === 0) {
      console.log('[DevTrack] Empty database detected. Auto-seeding initial demo data...');
      await seedDemoData();
    }
  } catch (err) {
    console.warn('[DevTrack] Seed check warning:', err);
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 DevTrack API Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`☁️  GCP Project:  ${projectId}`);
      console.log(`====================================================`);
    });
  }
}

startServer();

export default app;
