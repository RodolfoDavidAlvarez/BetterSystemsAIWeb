import type { Express } from "express";

export function registerRoutes(app: Express) {
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message } = req.body;
      
      // Here you would typically integrate with your email service
      // For now, we'll just send a success response
      
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to send message" 
      });
    }
  });
}
