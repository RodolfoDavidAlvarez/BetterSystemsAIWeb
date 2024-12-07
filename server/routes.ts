import type { Express, Request, Response } from "express";
import express from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fetch from "node-fetch";
import fs from "fs";
import mime from 'mime-types';

// In-memory store for analysis results (replace with database in production)
let latestAnalysis: any = null;

interface FileRequest extends Request {
  file?: Express.Multer.File;
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'server', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

export function registerRoutes(app: Express) {
  // Add enhanced static file serving middleware
  app.use('/uploads', (_req, res, next) => {
    // Set CORS and other necessary headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cache-Control', 'public, max-age=31536000');
    
    // Remove any headers that might cause issues with automated tools
    res.removeHeader('Cross-Origin-Resource-Policy');
    
    next();
  }, express.static(uploadsDir, {
    setHeaders: (res, _path) => {
      // Set correct content type based on file extension
      const contentType = mime.lookup(_path);
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
    },
    // Enable direct file access
    extensions: ['jpg', 'jpeg', 'png'],
    // Custom 404 handler
    fallthrough: false
  }));

  // Add error handler for 404s
  app.use('/uploads', (err: any, _req: Request, res: Response, next: Function) => {
    if (err.status === 404) {
      res.status(404).json({
        error: 'File not found',
        status: 404
      });
    } else {
      next(err);
    }
  });

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

  app.post("/api/upload", upload.single('photo'), async (req: FileRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Construct absolute URL for the uploaded file using Replit's public URL
      const baseUrl = process.env.REPLIT_SLUG 
        ? `https://${process.env.REPLIT_SLUG}.replit.dev`
        : `http://${req.get('host')}`;
      const photoUrl = `${baseUrl}/uploads/${path.basename(req.file.filename)}`;
      
      // Log for debugging
      console.log('Generated photo URL:', photoUrl);
      console.log('File path:', req.file.path);

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
  app.get("/api/photo-analysis", (_req, res) => {
    res.json(latestAnalysis || { result: null });
  });
}
