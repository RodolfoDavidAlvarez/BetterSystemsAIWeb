import type { Express } from "express";

export function registerRoutes(app: Express) {
  app.post("/api/contact", async (_req, res) => {
    try {
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to send message" 
      });
    }
  });
}