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

// New Client Onboarding endpoint
app.post('/api/onboard', async (req, res) => {
  try {
    const data = req.body;
    const submittedAt = new Date().toISOString();

    // Save to Airtable
    try {
      const record = {
        'Form Type': 'New Client Onboarding',
        'Submitted At': submittedAt,
        'Status': 'New',
        'Name': data.primaryContactName || data.businessName || '',
        'Email': data.primaryContactEmail || '',
        'Phone': data.primaryContactPhone || '',
        'Company': data.businessName || '',
        'Form Data': JSON.stringify({
          ...data,
          formType: 'New Client Onboarding',
          submittedAt
        })
      };

      if (data.additionalNotes) {
        record['Additional Notes'] = data.additionalNotes;
      }

      await base(process.env.AIRTABLE_TABLE_NAME).create(record);
    } catch (error) {
      console.error('Error saving to Airtable:', error);
    }

    // Send customer confirmation email
    if (data.primaryContactEmail) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
          to: data.primaryContactEmail,
          subject: 'Welcome to Better Systems AI - Onboarding Received',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4285F4;">Welcome aboard! 🎉</h2>
              <p>Hi ${data.primaryContactName || 'there'},</p>
              <p>Thank you for completing your onboarding information. We're excited to begin this partnership!</p>
              <h3>What happens next?</h3>
              <ul>
                <li>Our team will review your information within 24 hours</li>
                <li>We'll schedule a kickoff meeting to discuss your specific needs</li>
                <li>Begin customizing your AI solution</li>
              </ul>
              <p>If you have any immediate questions, feel free to reach out.</p>
              <p>Best regards,<br>The Better Systems AI Team</p>
            </div>
          `,
        });
      } catch (error) {
        console.error('Error sending customer email:', error);
      }
    }

    // Send admin notification to ralvarez@soilseedandwater.com for testing
    try {
      const adminEmailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">New Client Onboarding</h1>
            <p style="color: #94a3b8; margin-top: 8px;">A new client has completed the onboarding form</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Business Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0;">Company:</td><td style="color: #fff; padding: 8px 0;"><strong>${data.businessName || 'Not provided'}</strong></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Legal Name:</td><td style="color: #fff; padding: 8px 0;">${data.legalBusinessName || 'Not provided'}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Industry:</td><td style="color: #fff; padding: 8px 0;">${data.industry || 'Not provided'}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Company Size:</td><td style="color: #fff; padding: 8px 0;">${data.companySize || 'Not provided'}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Website:</td><td style="color: #fff; padding: 8px 0;">${data.website || 'Not provided'}</td></tr>
            </table>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Primary Contact</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0;">Name:</td><td style="color: #fff; padding: 8px 0;"><strong>${data.primaryContactName || 'Not provided'}</strong></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Title:</td><td style="color: #fff; padding: 8px 0;">${data.primaryContactTitle || 'Not provided'}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Email:</td><td style="color: #fff; padding: 8px 0;"><a href="mailto:${data.primaryContactEmail}" style="color: #60a5fa;">${data.primaryContactEmail || 'Not provided'}</a></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Phone:</td><td style="color: #fff; padding: 8px 0;">${data.primaryContactPhone || 'Not provided'}</td></tr>
            </table>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Team Contacts</h2>
            <div style="margin-bottom: 16px;">
              <h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Operations</h3>
              <p style="margin: 4px 0; color: #fff;">${data.operationsContactName || 'Not provided'} ${data.operationsContactTitle ? '(' + data.operationsContactTitle + ')' : ''}</p>
              <p style="margin: 4px 0; color: #94a3b8;">${data.operationsContactEmail || ''} ${data.operationsContactPhone ? '| ' + data.operationsContactPhone : ''}</p>
            </div>
            <div>
              <h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Billing</h3>
              <p style="margin: 4px 0; color: #fff;">${data.billingContactName || 'Not provided'} ${data.billingContactTitle ? '(' + data.billingContactTitle + ')' : ''}</p>
              <p style="margin: 4px 0; color: #94a3b8;">${data.billingContactEmail || ''} ${data.billingContactPhone ? '| ' + data.billingContactPhone : ''}</p>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Project Scope</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0;">Budget:</td><td style="color: #fff; padding: 8px 0;">${data.budgetRange || 'Not provided'}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Timeline:</td><td style="color: #fff; padding: 8px 0;">${data.timeline || 'Not provided'}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Referral Source:</td><td style="color: #fff; padding: 8px 0;">${data.referralSource || 'Not provided'}</td></tr>
            </table>
            ${data.painPoints ? '<div style="margin-top: 16px;"><h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Pain Points</h3><p style="color: #fff; margin: 0; white-space: pre-wrap;">' + data.painPoints + '</p></div>' : ''}
            ${data.currentTools ? '<div style="margin-top: 16px;"><h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Current Tools</h3><p style="color: #fff; margin: 0;">' + data.currentTools + '</p></div>' : ''}
            ${data.additionalNotes ? '<div style="margin-top: 16px;"><h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Additional Notes</h3><p style="color: #fff; margin: 0; white-space: pre-wrap;">' + data.additionalNotes + '</p></div>' : ''}
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            Submitted at: ${submittedAt}
          </p>
        </div>
      `;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
        to: 'ralvarez@soilseedandwater.com',
        subject: `🚀 New Client Onboarding: ${data.businessName || 'Unknown Business'}`,
        html: adminEmailHtml,
      });
      console.log('Admin notification sent to ralvarez@soilseedandwater.com');
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }

    res.json({
      success: true,
      message: 'Onboarding information received successfully.'
    });
  } catch (error) {
    console.error('Onboarding API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process onboarding information. Please try again.',
      details: error.message
    });
  }
});

// Export for Vercel
export default app;
