import type { Express, Request } from "express";
import express from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fetch from "node-fetch";

// In-memory store for analysis results (replace with database in production)
let latestAnalysis: any = null;

interface FileRequest extends Request {
  file?: Express.Multer.File;
}

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
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
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

  app.post("/api/upload", upload.single('photo'), async (req: FileRequest, res) => {
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
  // Endpoint to receive analysis results from make.com webhook
  app.post("/api/photo-analysis", express.json(), (req, res) => {
    try {
      const analysisData = req.body;
      latestAnalysis = {
        result: {
          message: analysisData.message,
          confidence: analysisData.confidence,
          labels: analysisData.labels
        }
      };
      res.json({ success: true });
    } catch (error) {
      console.error('Analysis webhook error:', error);
      res.status(500).json({ success: false, message: "Failed to process analysis" });
    }
  });

  // Endpoint to get latest analysis results
  app.get("/api/photo-analysis", (req, res) => {
    res.json(latestAnalysis || { result: null });
  });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload photo"
      });
    }
  });
}
