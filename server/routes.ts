import type { Express } from "express";
import path from "path";

export function registerRoutes(app: Express) {
  // API routes
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
}