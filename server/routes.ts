import type { Express } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fetch from "node-fetch";

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: "server/public/uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

export function registerRoutes(app: Express) {
  // Serve uploaded files statically
  app.use('/uploads', express.static('server/public/uploads'));

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message } = req.body;
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to send message" 
      });
    }
  });

  app.post("/api/upload", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      // Send webhook
      try {
        await fetch('https://hook.us1.make.com/otjodeosdkyu7m26fyl0d93iwwysmtyt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photoUrl }),
        });
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
        // Continue even if webhook fails
      }

      res.json({
        success: true,
        message: "Photo uploaded successfully",
        photoUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload photo"
      });
    }
  });
}
