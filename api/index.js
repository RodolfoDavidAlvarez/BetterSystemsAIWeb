// Vercel serverless function handler
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Resend } from 'resend';
import Airtable from 'airtable';

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

// Initialize services
const resend = new Resend(process.env.RESEND_API_KEY);
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

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

    const submittedAt = new Date().toISOString();
    const formType = formIdentifier || 'Contact Form';

    // Save to Airtable
    try {
      const record = {
        'Form Type': formType,
        'Submitted At': submittedAt,
        'Status': 'New',
        'Name': name || '',
        'Email': email || '',
        'Phone': phone || '',
        'Company': company || '',
        'Form Data': JSON.stringify({
          name,
          email,
          phone,
          company,
          notes,
          formType,
          submittedAt
        })
      };

      if (notes) {
        record['Additional Notes'] = notes;
      }

      await base(process.env.AIRTABLE_TABLE_NAME).create(record);
    } catch (error) {
      console.error('Error saving to Airtable:', error);
      // Continue even if Airtable fails
    }

    // Send customer confirmation email
    if (email) {
      try {
        const subject = formType === 'Contact Card Form'
          ? 'Welcome to Better Systems AI!'
          : `Thank you for your ${formType} submission`;

        const htmlContent = formType === 'Contact Card Form'
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4285F4;">Welcome, ${name}! 👋</h2>
              <p>Thank you for submitting your contact information. We're excited to connect with you and learn more about ${company ? company : 'your company'}.</p>
              <p>Our team will review your information and get back to you soon to discuss how Better Systems AI can help transform your business.</p>
              <p>In the meantime, feel free to reach out if you have any questions.</p>
              <p>Best regards,<br>Rodolfo Alvarez<br>CEO & Founder<br>Better Systems AI</p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4285F4;">Got it! We'll be in touch soon.</h2>
              <p>Hi ${name},</p>
              <p>Thanks for reaching out! We'll review your message and get back to you within 24 hours.</p>
              <p>Talk soon!<br>Better Systems AI</p>
            </div>
          `;

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
          to: email,
          subject: subject,
          html: htmlContent,
        });
      } catch (error) {
        console.error('Error sending customer email:', error);
        // Continue even if email fails
      }
    }

    // Send admin notification
    try {
      const subjectLine = formType === 'Contact Card Form'
        ? `New Contact Card Submission from ${name}${company ? ` - ${company}` : ''}`
        : `New ${formType} submission from ${name}`;

      const htmlContent = formType === 'Contact Card Form'
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4285F4;">New Contact Card Form Submission</h2>
            <h3>Contact Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            ${notes ? `
            <h3>Notes</h3>
            <p style="white-space: pre-wrap;">${notes}</p>
            ` : ''}
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Submitted at: ${submittedAt}</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4285F4;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
          </div>
        `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
        to: process.env.EMAIL_TO || 'contact@bettersystemsai.com',
        subject: subjectLine,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Continue even if email fails
    }

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
