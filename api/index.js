// Vercel serverless function handler
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sendContactEmail } from '../server/services/email.js';
import { saveToAirtable } from '../server/services/airtable.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: 'production'
  });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { formIdentifier, name, email, phone, company, notes } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Either email or phone is required'
      });
    }

    // Save to Airtable
    await saveToAirtable({
      formIdentifier: formIdentifier || 'Contact Form',
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      notes: notes || ''
    });

    // Send email notification
    await sendContactEmail({
      formIdentifier: formIdentifier || 'Contact Form',
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      notes: notes || ''
    });

    res.json({
      success: true,
      message: 'Contact information received successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process contact form',
      details: error.message
    });
  }
});

// Export for Vercel
export default app;