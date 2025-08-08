// Vercel serverless function handler
import '../server/loadEnv.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registerRoutes } from '../server/routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Register API routes
registerRoutes(app);

// Export for Vercel
export default app;