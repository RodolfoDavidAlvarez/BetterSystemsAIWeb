import type { Express } from "express";
import { login, register, getCurrentUser } from './controllers/auth';
import { 
  createBlogPost, 
  getAllBlogPosts, 
  getAllBlogPostsAdmin, 
  getBlogPostBySlug, 
  getBlogPostById, 
  updateBlogPost, 
  deleteBlogPost 
} from './controllers/blog';
import { authenticate, isAdmin } from './middleware/auth';

export function registerRoutes(app: Express) {
  // Public API routes
  app.post("/api/contact", async (req, res) => {
    console.log('Contact API endpoint hit');
    try {
      console.log('Processing contact request:', req.body);
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      console.error('Contact API error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send message" 
      });
    }
  });
  
  // Auth routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.get("/api/auth/me", authenticate, getCurrentUser);
  
  // Emergency test endpoint for debugging auth issues
  app.get("/api/auth/test", (req, res) => {
    console.log('Auth test endpoint accessed');
    res.json({
      success: true,
      message: 'Auth API is accessible',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });
  
  // Public blog routes
  app.get("/api/blog", getAllBlogPosts);
  app.get("/api/blog/:slug", getBlogPostBySlug);
  
  // Protected admin blog routes
  app.post("/api/admin/blog", authenticate, isAdmin, createBlogPost);
  app.get("/api/admin/blog", authenticate, isAdmin, getAllBlogPostsAdmin);
  app.get("/api/admin/blog/:id", authenticate, isAdmin, getBlogPostById);
  app.put("/api/admin/blog/:id", authenticate, isAdmin, updateBlogPost);
  app.delete("/api/admin/blog/:id", authenticate, isAdmin, deleteBlogPost);
}