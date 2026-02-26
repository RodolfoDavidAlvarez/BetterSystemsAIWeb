// Vercel serverless function handler
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Resend } from 'resend';
import Airtable from 'airtable';
import OpenAI from 'openai';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

const app = express();

// Database schema matching production database
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  phone: text('phone'),
  password_hash: text('password_hash'),
  approval_status: text('approval_status').notNull().default('pending_approval'),
  last_seen_at: timestamp('last_seen_at'),
  created_at: timestamp('created_at').defaultNow()
});

// Database connection
const queryClient = postgres(process.env.DATABASE_URL);
const db = drizzle(queryClient);

// JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || 'bettersystems-blog-secret-key-dev';
const createAuthToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

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

// ==================== AUTHENTICATION ROUTES ====================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by email (username field contains email)
    const foundUsers = await db.select().from(users).where(eq(users.email, username)).limit(1);

    if (foundUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = foundUsers[0];

    // Compare passwords (using password_hash field)
    const passwordHash = user.password_hash || user.password;
    if (!passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = createAuthToken({
      id: user.id,
      username: user.email,
      role: user.role
    });

    // Set token in cookie
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.email,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Insert new user
    const newUser = await db.insert(users).values({
      username,
      password: hashedPassword,
      name,
      email,
      role: 'admin'
    }).returning();

    // Create JWT token
    const token = createAuthToken({
      id: newUser[0].id,
      username: newUser[0].username,
      role: 'admin'
    });

    // Set token in cookie
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        name: newUser[0].name,
        email: newUser[0].email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', async (req, res) => {
  try {
    // Get token from header or cookie
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user by id
    const foundUsers = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);

    if (foundUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = foundUsers[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// ==================== INVOICE PAYMENT PAGES ====================

const INVOICE_PAYMENTS = {
  "BSA-2026-004": {
    invoiceNumber: "BSA-2026-004",
    clientName: "Brian Mitchell",
    projectName: "Bubba's New Home Guide — Interactive Property Map",
    issuedDate: "February 8, 2026",
    dueDate: "March 31, 2026",
    subtotal: 2393.50,
    fullTotal: 2393.50,
    discountPercent: 0,
    discountDeadline: "2026-02-15T23:59:59-07:00",
    discountPaymentUrl: "https://buy.stripe.com/cNi6oIdl8bd3bCn4L6c3m0j",
    fullPaymentUrl: "https://buy.stripe.com/cNi6oIdl8bd3bCn4L6c3m0j",
    lineItems: [
      { description: "Application Delivery", detail: "Final 50% balance per contract (Dec 30, 2025)", amount: 898.50 },
      { description: "Multi-Model Builder Pins", detail: "Add-on scope change — 7 hrs @ $65/hr (Jan 13, 2026)", amount: 455.00 },
      { description: "Perimeter / Boundary Feature", detail: "Add-on scope change — 5 hrs @ $65/hr (Jan 13, 2026)", amount: 325.00 },
      { description: "Zillow-Style Thumbnail Map Pins", detail: "Community photo + price label on map markers — 3.5 hrs @ $65/hr", amount: 227.50 },
      { description: "Multicolored Boundary Line Styling", detail: "Custom boundary colors + always-visible mode — 1.5 hrs @ $65/hr", amount: 97.50 },
      { description: "Additional Development (Feb 10–25)", detail: "Amenity thumbnails, builder flow improvements, community view refinements — 6 hrs @ $65/hr", amount: 390.00 },
    ],
  },
  "BSA-2026-005": {
    invoiceNumber: "BSA-2026-005",
    clientName: "Desert Moon Lighting",
    projectName: "CRM Web Application - Phase 1 Final Balance",
    issuedDate: "February 17, 2026",
    dueDate: "March 19, 2026",
    subtotal: 2979.50,
    fullTotal: 2979.50,
    discountPercent: 5,
    discountDeadline: "2026-02-24T23:59:59-07:00",
    discountPaymentUrl: process.env.DESERT_MOON_DISCOUNT_PAYMENT_URL || "https://buy.stripe.com/REPLACE_DESERT_MOON_DISCOUNT",
    fullPaymentUrl: process.env.DESERT_MOON_FULL_PAYMENT_URL || "https://buy.stripe.com/REPLACE_DESERT_MOON_FULL",
    lineItems: [
      { description: "Phase 1 Delivery", detail: "Final balance for delivered CRM web application scope", amount: 2752.00 },
      { description: "Additional Agreed Scope", detail: "SMS, installation confirmation, payment confirmation, and related updates — 3.5 hrs @ $65/hr", amount: 227.50 },
    ],
  },
};

app.get('/api/pay/:invoiceNumber', async (req, res) => {
  const config = INVOICE_PAYMENTS[req.params.invoiceNumber];
  if (!config) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  const now = new Date();
  const deadline = new Date(config.discountDeadline);
  const isDiscounted = now <= deadline;

  const savings = Math.round(config.fullTotal * (config.discountPercent / 100) * 100) / 100;
  const discountedTotal = Math.round((config.fullTotal - savings) * 100) / 100;

  const deadlineDisplay = new Date(config.discountDeadline).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Phoenix",
  });

  // Check if invoice is paid (from database)
  let isPaid = false;
  try {
    const rows = await queryClient`SELECT status, amount_paid FROM invoices WHERE invoice_number = ${config.invoiceNumber} LIMIT 1`;
    const row = rows[0];
    if (row && (row.status === 'paid' || Number(row.amount_paid) > 0)) {
      isPaid = true;
    }
  } catch (e) {
    console.error("[Payment Page] DB check failed:", e);
  }

  res.json({
    invoiceNumber: config.invoiceNumber,
    clientName: config.clientName,
    projectName: config.projectName,
    issuedDate: config.issuedDate,
    dueDate: config.dueDate,
    subtotal: config.subtotal,
    total: isDiscounted ? discountedTotal : config.fullTotal,
    paymentUrl: isDiscounted ? config.discountPaymentUrl : config.fullPaymentUrl,
    isDiscounted,
    discountPercent: config.discountPercent,
    discountDeadline: deadlineDisplay,
    originalTotal: config.fullTotal,
    savings: isDiscounted ? savings : 0,
    lineItems: config.lineItems,
    isPaid,
  });
});

// ElevenLabs signed URL endpoint
app.get('/api/elevenlabs/signed-url', async (req, res) => {
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const AGENT_ID = 'agent_7101kebbmvdcfbj8txqzhrmghh1e';

    if (!ELEVENLABS_API_KEY) {
      console.error('[ElevenLabs] API key not configured');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to get signed URL from ElevenLabs' });
    }

    const data = await response.json();
    res.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('[ElevenLabs] Error getting signed URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// ==================== AI LEAD ANALYSIS ====================

const BUSINESS_CONTEXT = `
Better Systems AI is a Business Transformation Consultancy that builds technology solutions.

SERVICES & PRICING:
1. Templated Platforms (subscription): $3,000-$5,000/month
   - Fleet Management System: Vehicle tracking, repair requests, service records
   - CRM Proposal System: Pipeline, quoting, invoicing, payment collection

2. Custom Builds: $5,000 to six figures
   - Custom software automating repetitive work
   - AI assistants for websites/phones
   - Full workflow automation

3. Enterprise Transformation: $20,000-$100,000+
   - Full departmental overhaul
   - Admin operations, marketing, sales transformation

IDEAL CUSTOMER:
- Revenue: $10K-$100K+/month
- Running on duct tape (spreadsheets, disconnected tools)
- Teams wasting hours on repetitive work
- Losing leads due to slow follow-up
- Data scattered across multiple apps

QUALIFICATION CRITERIA:
- HOT: Has budget, urgent need, decision maker, clear timeline
- WARM: Shows interest, some pain points, may need nurturing
- COLD: Just browsing, no clear need, unclear budget
- NOT_QUALIFIED: Wrong fit, no budget, outside our services
`;

async function analyzeVoiceAgentLead(transcript) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (!process.env.OPENAI_API_KEY) {
    console.error('[Lead Analysis] OpenAI API key not configured');
    return getDefaultAnalysis(transcript);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert sales analyst for Better Systems AI. Analyze voice agent conversations and extract actionable insights.

${BUSINESS_CONTEXT}

Respond with valid JSON only, no markdown. Use this exact structure:
{
  "summary": "2-3 sentence executive summary of the conversation",
  "contactInfo": {
    "name": "extracted name or null",
    "email": "extracted email or null",
    "phone": "extracted phone or null",
    "company": "extracted company name or null"
  },
  "qualification": {
    "score": "hot|warm|cold|not_qualified",
    "reasoning": "Why this score was given",
    "estimatedRevenue": "Potential deal size if mentioned or inferable, or null",
    "timeline": "When they want to start if mentioned, or null"
  },
  "painPoints": ["list", "of", "pain", "points"],
  "interestedServices": ["which", "services", "they", "mentioned"],
  "recommendedFollowUp": "Specific next action Rodo should take",
  "sentiment": "positive|neutral|negative"
}`
        },
        {
          role: 'user',
          content: `Analyze this voice agent conversation transcript:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return getDefaultAnalysis(transcript);
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('[Lead Analysis] Error:', error.message);
    return getDefaultAnalysis(transcript);
  }
}

function getDefaultAnalysis(transcript) {
  const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = transcript.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  return {
    summary: 'Conversation with website visitor. AI analysis unavailable - review transcript manually.',
    contactInfo: {
      name: null,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      company: null,
    },
    qualification: {
      score: 'warm',
      reasoning: 'Unable to analyze - defaulting to warm for manual review',
      estimatedRevenue: null,
      timeline: null,
    },
    painPoints: [],
    interestedServices: [],
    recommendedFollowUp: 'Review transcript and reach out if contact info was provided',
    sentiment: 'neutral',
  };
}

function formatLeadEmailHtml(analysis, transcript, conversationId, duration) {
  const scoreColors = { hot: '#dc2626', warm: '#f59e0b', cold: '#3b82f6', not_qualified: '#6b7280' };
  const scoreEmoji = { hot: '🔥', warm: '⚡', cold: '❄️', not_qualified: '⏸️' };
  const sentimentEmoji = { positive: '😊', neutral: '😐', negative: '😟' };

  const scoreColor = scoreColors[analysis.qualification.score] || '#6b7280';
  const emoji = scoreEmoji[analysis.qualification.score] || '📞';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; }
    .container { max-width: 650px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}dd 100%); color: white; padding: 25px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .score { font-size: 14px; opacity: 0.9; margin-top: 5px; }
    .content { background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 25px; border-radius: 0 0 12px 12px; }
    .summary-box { background: #f8fafc; border-left: 4px solid ${scoreColor}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { background: #f9fafb; padding: 12px; border-radius: 8px; }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .info-value { font-weight: 500; color: #111827; }
    .tag { display: inline-block; background: #e5e7eb; color: #374151; padding: 4px 10px; border-radius: 999px; font-size: 13px; margin: 2px; }
    .tag.service { background: #dbeafe; color: #1d4ed8; }
    .tag.pain { background: #fef3c7; color: #92400e; }
    .follow-up { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; }
    .follow-up-title { font-weight: 600; color: #065f46; margin-bottom: 5px; }
    .transcript { background: #f9fafb; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 13px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
    .meta { font-size: 12px; color: #9ca3af; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} Voice Agent Lead - ${analysis.qualification.score.toUpperCase()}</h1>
      <div class="score">Sentiment: ${sentimentEmoji[analysis.sentiment]} ${analysis.sentiment} | Duration: ${Math.round(duration / 60)} min</div>
    </div>

    <div class="content">
      <div class="summary-box">
        <strong>Summary:</strong> ${analysis.summary}
      </div>

      <div class="section">
        <div class="section-title">Contact Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Name</div>
            <div class="info-value">${analysis.contactInfo.name || 'Not provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${analysis.contactInfo.email || 'Not provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">${analysis.contactInfo.phone || 'Not provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Company</div>
            <div class="info-value">${analysis.contactInfo.company || 'Not provided'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Lead Qualification</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Score Reasoning</div>
            <div class="info-value">${analysis.qualification.reasoning}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Est. Deal Size</div>
            <div class="info-value">${analysis.qualification.estimatedRevenue || 'Unknown'}</div>
          </div>
        </div>
        ${analysis.qualification.timeline ? `<div class="info-item" style="margin-top: 10px;"><div class="info-label">Timeline</div><div class="info-value">${analysis.qualification.timeline}</div></div>` : ''}
      </div>

      ${analysis.painPoints.length > 0 ? `
      <div class="section">
        <div class="section-title">Pain Points Identified</div>
        ${analysis.painPoints.map(p => `<span class="tag pain">${p}</span>`).join('')}
      </div>
      ` : ''}

      ${analysis.interestedServices.length > 0 ? `
      <div class="section">
        <div class="section-title">Services Interested In</div>
        ${analysis.interestedServices.map(s => `<span class="tag service">${s}</span>`).join('')}
      </div>
      ` : ''}

      <div class="section">
        <div class="follow-up">
          <div class="follow-up-title">Recommended Follow-Up</div>
          ${analysis.recommendedFollowUp}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Full Transcript</div>
        <div class="transcript">${transcript}</div>
      </div>

      <div class="meta">
        Conversation ID: ${conversationId}<br>
        Processed: ${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })} (Arizona Time)
      </div>
    </div>
  </div>
</body>
</html>`.trim();
}

// ==================== ADMIN BILLING (COMPAT ROUTES) ====================
// Keep admin billing UI functional in production serverless API.
app.get('/api/admin/billing/dashboard', async (req, res) => {
  try {
    res.json({
      invoices: [],
      paymentIntents: [],
      subscriptions: [],
      quotes: [],
      paymentLinks: [],
      clientGroups: [],
      summary: {
        totalRevenue: 0,
        totalOutstanding: 0,
        totalDraft: 0,
        totalInvoices: 0,
        totalSubscriptions: 0,
        totalClients: 0
      }
    });
  } catch (error) {
    console.error('Billing dashboard error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch billing dashboard' });
  }
});

app.get('/api/admin/billing/monthly-revenue', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        monthlyRevenue: [],
        totalRevenue: 0
      }
    });
  } catch (error) {
    console.error('Monthly revenue error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly revenue' });
  }
});

app.get('/api/admin/billing/payments', async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Payment history error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// ==================== ADMIN TASKS (COMPAT ROUTES) ====================
const defaultTasksByClient = {
  'Desert Moon Lighting': [
    { id: 1, task: 'SMS Notification for E-signature', status: 'NOT DONE', priority: 'Quick win', clientName: 'Desert Moon Lighting' },
    { id: 2, task: 'Finalize payment collection system', status: 'NOT DONE', priority: 'Revenue', clientName: 'Desert Moon Lighting' }
  ],
  'Agave Fleet': [
    { id: 3, task: 'Make sure that the mechanics are able to properly submit the service', status: 'NOT DONE', priority: 'Fiex', clientName: 'Agave Fleet' }
  ]
};

app.get('/api/admin/client-tasks', async (req, res) => {
  try {
    res.json({ success: true, tasksByClient: defaultTasksByClient });
  } catch (error) {
    console.error('Client tasks fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch client tasks' });
  }
});

app.get('/api/admin/clients/latest', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '8', 10), 20);

    const rows = await queryClient`
      select id, name, email, phone, status, source, created_at as "createdAt"
      from bettersystems.clients
      order by created_at desc
      limit ${limit}
    `;

    res.json({ success: true, clients: rows || [] });
  } catch (error) {
    console.error('Latest clients fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch latest clients' });
  }
});

app.get('/api/admin/ops-status', async (req, res) => {
  try {
    res.json({
      success: true,
      latestEvents: [
        {
          date: '2026-02-18',
          title: 'Water Solutions Phase II proposal sent',
          detail: 'Sent to Linda + Desert Moon team. Investment: $3,250 + $65/hr.'
        },
        {
          date: '2026-02-17',
          title: 'Phase 1 closeout summary sent',
          detail: 'Final closeout and payment page delivered to the team.'
        },
        {
          date: '2026-02-17',
          title: 'Phase 1 final balance sent',
          detail: 'Early pay: $2,830.52 by Feb 24. Standard: $2,979.50. Final due Mar 19.'
        }
      ],
      waitingOn: [
        'Linda/team approval for Water Solutions Phase II',
        'Answers to 3 kickoff items (legal wording, required packet pages, QB account path)',
        'Phase 1 payment completion via BSA-2026-005 payment page'
      ],
      links: {
        paymentPage: 'https://www.bettersystems.ai/pay/BSA-2026-005'
      }
    });
  } catch (error) {
    console.error('Ops status fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch ops status' });
  }
});

app.post('/api/admin/client-tasks', async (req, res) => {
  try {
    // Compat success response for UI init flow.
    res.json({ success: true, task: req.body || null });
  } catch (error) {
    console.error('Client task create error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create client task' });
  }
});

app.put('/api/admin/client-tasks/:id', async (req, res) => {
  try {
    // Compat success response for UI status updates.
    res.json({ success: true, id: req.params.id, updates: req.body || {} });
  } catch (error) {
    console.error('Client task update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update client task' });
  }
});

app.delete('/api/admin/client-tasks/:id', async (req, res) => {
  try {
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Client task delete error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete client task' });
  }
});

// ElevenLabs Voice Agent Webhook - Post-call notifications with AI analysis
app.post('/api/webhooks/elevenlabs', async (req, res) => {
  console.log('[ElevenLabs Webhook] Received post-call data');
  console.log('[ElevenLabs Webhook] Payload keys:', Object.keys(req.body || {}));

  try {
    const payload = req.body;
    console.log('[ElevenLabs Webhook] Full payload:', JSON.stringify(payload).slice(0, 2000));

    // Extract conversation data - ElevenLabs format
    const data = payload.data || payload;
    const conversationId = data.conversation_id || data.id || payload.conversation_id || 'unknown';

    // ElevenLabs transcript format: array of {role, message} or {role, content}
    const transcript = data.transcript || data.messages || payload.transcript || [];
    const duration = data.call_duration_secs || data.duration || payload.duration || 0;

    // Format transcript for analysis
    let transcriptText = '';
    if (Array.isArray(transcript)) {
      transcriptText = transcript.map((msg) => {
        const role = msg.role === 'agent' ? 'Aria' : 'Visitor';
        const content = msg.message || msg.content || msg.text || '';
        return `${role}: ${content}`;
      }).join('\n\n');
    } else if (typeof transcript === 'string') {
      transcriptText = transcript;
    }

    console.log('[ElevenLabs Webhook] Transcript length:', transcriptText.length);
    console.log('[ElevenLabs Webhook] Transcript preview:', transcriptText.slice(0, 500));

    // Skip if no meaningful transcript
    if (!transcriptText || transcriptText.trim().length < 20) {
      console.log('[ElevenLabs Webhook] Skipping - no meaningful transcript');
      return res.json({ success: true, skipped: true, reason: 'no_transcript' });
    }

    // Analyze the conversation with AI
    console.log('[ElevenLabs Webhook] Analyzing conversation with AI...');
    const analysis = await analyzeVoiceAgentLead(transcriptText);
    console.log(`[ElevenLabs Webhook] Lead score: ${analysis.qualification.score}`);

    // Format the email HTML with AI insights
    const emailHtml = formatLeadEmailHtml(analysis, transcriptText, conversationId, duration);

    // Send to Rodo's personal email with AI-powered subject line
    const scoreEmoji = { hot: '🔥', warm: '⚡', cold: '❄️', not_qualified: '⏸️' };
    const emoji = scoreEmoji[analysis.qualification.score] || '📞';

    const subjectParts = [
      emoji,
      analysis.qualification.score.toUpperCase(),
      analysis.contactInfo.name ? `- ${analysis.contactInfo.name}` : '',
      analysis.contactInfo.company ? `(${analysis.contactInfo.company})` : '',
      '- Voice Agent Lead'
    ].filter(Boolean);

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
      to: 'rodolfo@bettersystems.ai',
      subject: subjectParts.join(' '),
      html: emailHtml,
    });

    console.log(`[ElevenLabs Webhook] AI-enhanced notification sent for conversation ${conversationId}`);
    res.json({
      success: true,
      conversationId,
      leadScore: analysis.qualification.score,
      contactExtracted: !!(analysis.contactInfo.email || analysis.contactInfo.phone)
    });
  } catch (error) {
    console.error('[ElevenLabs Webhook] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PLAUD WEBHOOK & RECORDINGS ====================

import crypto from 'crypto';

// Plaud Webhook - receives recording data, stores in DB, kicks off transcription
app.post('/api/webhooks/plaud', async (req, res) => {
  console.log('[Plaud Webhook] Received data');
  console.log('[Plaud Webhook] Payload keys:', Object.keys(req.body || {}));

  try {
    const payload = req.body;

    // Verify HMAC-SHA256 signature if secret is configured
    const secret = process.env.PLAUD_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers['x-signature'];
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }
      const sortedKeys = Object.keys(payload).sort();
      const sourceString = sortedKeys.map(k => `${k}=${typeof payload[k] === 'object' ? JSON.stringify(payload[k]) : payload[k]}`).join('&');
      const computed = crypto.createHmac('sha256', secret).update(sourceString).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Extract recording data from Plaud payload
    const eventData = payload.event_data || payload.data || payload;
    const plaudRecordingId = eventData.recording_id || eventData.id || eventData.transcription_id || null;
    const audioUrl = eventData.audio_url || eventData.file_url || eventData.url || null;
    const title = eventData.title || eventData.name || eventData.summary || `Plaud Recording ${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })}`;
    const duration = eventData.duration || eventData.duration_seconds || null;
    const recordedAt = eventData.recorded_at || eventData.created_at || eventData.timestamp || null;
    const plaudTranscript = eventData.transcript || eventData.text || null;

    console.log(`[Plaud Webhook] Recording: ${plaudRecordingId}, Audio: ${audioUrl ? 'present' : 'missing'}`);

    // Store in database
    const rows = await queryClient`
      INSERT INTO recordings (
        plaud_recording_id, plaud_task_id, title, audio_url,
        duration_seconds, transcription_status, transcript, transcribed_at,
        recording_type, metadata, recorded_at, created_at, updated_at
      ) VALUES (
        ${plaudRecordingId},
        ${eventData.task_id || eventData.transcription_id || null},
        ${title},
        ${audioUrl},
        ${duration ? Math.round(Number(duration)) : null},
        ${audioUrl ? 'pending' : (plaudTranscript ? 'completed' : 'pending')},
        ${plaudTranscript || null},
        ${plaudTranscript ? new Date() : null},
        ${eventData.type || 'meeting'},
        ${JSON.stringify(payload)},
        ${recordedAt ? new Date(recordedAt) : new Date()},
        NOW(), NOW()
      ) RETURNING id, transcription_status
    `;

    const newRecording = rows[0];
    console.log(`[Plaud Webhook] Stored recording ${newRecording.id}`);

    // Kick off background transcription (non-blocking)
    if (audioUrl && !plaudTranscript && process.env.OPENAI_API_KEY) {
      transcribeRecordingAsync(newRecording.id, audioUrl).catch(err => {
        console.error(`[Plaud Webhook] Background transcription failed:`, err.message);
      });
    }

    res.json({
      success: true,
      recordingId: newRecording.id,
      transcriptionStatus: newRecording.transcription_status,
    });
  } catch (error) {
    console.error('[Plaud Webhook] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Background transcription function for Vercel serverless
async function transcribeRecordingAsync(recordingId, audioUrl) {
  console.log(`[Transcription] Starting for recording ${recordingId}`);

  await queryClient`UPDATE recordings SET transcription_status = 'processing', updated_at = NOW() WHERE id = ${recordingId}`;

  try {
    // Download audio
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) throw new Error(`Download failed: ${audioResponse.status}`);

    const audioBuffer = await audioResponse.arrayBuffer();
    const sizeMB = audioBuffer.byteLength / (1024 * 1024);
    console.log(`[Transcription] Audio size: ${sizeMB.toFixed(1)}MB`);

    if (sizeMB > 25) throw new Error(`Audio too large: ${sizeMB.toFixed(1)}MB (limit 25MB)`);

    // Determine extension
    const ext = audioUrl.match(/\.(mp3|mp4|mpeg|mpga|m4a|wav|webm)$/i)?.[1] || 'mp3';

    // Call OpenAI Whisper
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), `recording.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      throw new Error(`Whisper API error: ${whisperResponse.status} ${errText}`);
    }

    const result = await whisperResponse.json();
    const transcript = result.text;
    const duration = result.duration ? Math.round(result.duration) : null;

    console.log(`[Transcription] Complete: ${transcript.length} chars`);

    await queryClient`
      UPDATE recordings SET
        transcript = ${transcript},
        transcription_status = 'completed',
        transcribed_at = NOW(),
        duration_seconds = COALESCE(${duration}, duration_seconds),
        updated_at = NOW()
      WHERE id = ${recordingId}
    `;
  } catch (error) {
    console.error(`[Transcription] Failed for ${recordingId}:`, error.message);
    await queryClient`
      UPDATE recordings SET
        transcription_status = 'failed',
        transcription_error = ${error.message},
        updated_at = NOW()
      WHERE id = ${recordingId}
    `;
  }
}

// Admin recordings endpoints
app.get('/api/admin/recordings', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const rows = await queryClient`
      SELECT id, plaud_recording_id, title, audio_url, duration_seconds,
             transcription_status, transcript, client_id, deal_id,
             recording_type, tags, recorded_at, transcribed_at, created_at
      FROM recordings
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    res.json({ success: true, recordings: rows });
  } catch (error) {
    console.error('[Recordings] List error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch recordings' });
  }
});

app.get('/api/admin/recordings/:id', async (req, res) => {
  try {
    const rows = await queryClient`SELECT * FROM recordings WHERE id = ${req.params.id} LIMIT 1`;
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, recording: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recording' });
  }
});

app.put('/api/admin/recordings/:id', async (req, res) => {
  try {
    const { title, clientId, dealId, tags, recordingType } = req.body;
    const rows = await queryClient`
      UPDATE recordings SET
        title = COALESCE(${title}, title),
        client_id = COALESCE(${clientId}, client_id),
        deal_id = COALESCE(${dealId}, deal_id),
        tags = COALESCE(${tags}, tags),
        recording_type = COALESCE(${recordingType}, recording_type),
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, recording: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update recording' });
  }
});

app.post('/api/admin/recordings/:id/retranscribe', async (req, res) => {
  try {
    const rows = await queryClient`SELECT id, audio_url FROM recordings WHERE id = ${req.params.id} LIMIT 1`;
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (!rows[0].audio_url) return res.status(400).json({ success: false, message: 'No audio URL' });

    await queryClient`UPDATE recordings SET transcription_status = 'pending', transcription_error = NULL, updated_at = NOW() WHERE id = ${req.params.id}`;

    transcribeRecordingAsync(rows[0].id, rows[0].audio_url).catch(err => {
      console.error(`[Retranscribe] Failed:`, err.message);
    });

    res.json({ success: true, message: 'Transcription restarted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restart transcription' });
  }
});

// ==================== KNOWLEDGE BASE ENDPOINTS ====================

app.get('/api/admin/knowledge-base/entries', async (req, res) => {
  try {
    const entries = await queryClient`
      SELECT kb.*, c.name as client_name, d.name as deal_name
      FROM knowledge_base kb
      LEFT JOIN clients c ON kb.client_id = c.id
      LEFT JOIN deals d ON kb.deal_id = d.id
      WHERE kb.status != 'archived'
      ORDER BY kb.pinned DESC, kb.created_at DESC
      LIMIT 200
    `;
    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/knowledge-base/entries', async (req, res) => {
  try {
    const { title, content, content_type, company, project, category, tags, client_id, deal_id, event_date, source } = req.body;
    const [entry] = await queryClient`
      INSERT INTO knowledge_base (title, content, content_type, company, project, category, tags, client_id, deal_id, event_date, source)
      VALUES (${title}, ${content}, ${content_type || 'note'}, ${company || 'bsa'}, ${project || null}, ${category || null},
        ${tags || null}, ${client_id || null}, ${deal_id || null}, ${event_date || null}, ${source || 'manual'})
      RETURNING *
    `;
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/knowledge-base/entries/:id', async (req, res) => {
  try {
    const { title, content, content_type, company, project, category, status, pinned } = req.body;
    const [entry] = await queryClient`
      UPDATE knowledge_base SET
        title = COALESCE(${title || null}, title),
        content = COALESCE(${content || null}, content),
        content_type = COALESCE(${content_type || null}, content_type),
        company = COALESCE(${company || null}, company),
        project = COALESCE(${project || null}, project),
        category = COALESCE(${category || null}, category),
        status = COALESCE(${status || null}, status),
        pinned = COALESCE(${pinned ?? null}, pinned),
        updated_at = NOW()
      WHERE id = ${parseInt(req.params.id)}
      RETURNING *
    `;
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/knowledge-base/actions', async (req, res) => {
  try {
    const items = await queryClient`
      SELECT * FROM action_items
      ORDER BY
        CASE status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
        CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        due_date ASC NULLS LAST,
        created_at DESC
      LIMIT 200
    `;
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/knowledge-base/actions', async (req, res) => {
  try {
    const { title, description, assigned_to, company, project, priority, due_date, client_id, deal_id, source } = req.body;
    const [item] = await queryClient`
      INSERT INTO action_items (title, description, assigned_to, company, project, priority, due_date, client_id, deal_id, source)
      VALUES (${title}, ${description || null}, ${assigned_to || null}, ${company || 'bsa'}, ${project || null},
        ${priority || 'medium'}, ${due_date || null}, ${client_id || null}, ${deal_id || null}, ${source || 'manual'})
      RETURNING *
    `;
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/knowledge-base/actions/:id', async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const [item] = await queryClient`
      UPDATE action_items SET
        title = COALESCE(${title || null}, title),
        description = COALESCE(${description || null}, description),
        status = COALESCE(${status || null}, status),
        priority = COALESCE(${priority || null}, priority),
        assigned_to = COALESCE(${assigned_to || null}, assigned_to),
        due_date = COALESCE(${due_date || null}, due_date),
        completed_at = CASE WHEN ${status || null} = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = ${parseInt(req.params.id)}
      RETURNING *
    `;
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/knowledge-base/snapshots', async (req, res) => {
  try {
    const snapshots = await queryClient`
      SELECT * FROM context_snapshots ORDER BY generated_at DESC LIMIT 30
    `;
    res.json(snapshots);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Context Retrieval API (for Claude Code / OpenClaw startup) ───
app.get('/api/context/briefing', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.CONTEXT_API_KEY || process.env.JWT_SECRET;
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const latestSnapshot = await queryClient`
      SELECT briefing, generated_at FROM context_snapshots
      ORDER BY generated_at DESC LIMIT 1
    `;

    const pendingActions = await queryClient`
      SELECT id, title, description, assigned_to, company, project, priority, due_date
      FROM action_items WHERE status = 'pending'
      ORDER BY
        CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        due_date ASC NULLS LAST
    `;

    const recentRecordings = await queryClient`
      SELECT id, title, summary, recorded_at, duration_seconds, metadata
      FROM recordings
      WHERE transcription_status = 'completed'
      AND recorded_at > NOW() - INTERVAL '7 days'
      ORDER BY recorded_at DESC
    `;

    const pinnedKB = await queryClient`
      SELECT title, content, company, project, category
      FROM knowledge_base WHERE pinned = true AND status = 'published'
      ORDER BY updated_at DESC
    `;

    res.json({
      briefing: latestSnapshot[0]?.briefing || null,
      briefing_generated: latestSnapshot[0]?.generated_at || null,
      pending_actions: pendingActions,
      recent_recordings: recentRecordings,
      pinned_knowledge: pinnedKB,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/context/project/:project', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.CONTEXT_API_KEY || process.env.JWT_SECRET;
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const project = decodeURIComponent(req.params.project);

    const kbEntries = await queryClient`
      SELECT title, content, content_type, category, updated_at
      FROM knowledge_base WHERE project = ${project} AND status = 'published'
      ORDER BY pinned DESC, updated_at DESC
    `;

    const actions = await queryClient`
      SELECT id, title, description, status, priority, due_date
      FROM action_items WHERE project = ${project}
      ORDER BY status ASC, priority ASC, due_date ASC NULLS LAST
    `;

    const recordings = await queryClient`
      SELECT id, title, summary, recorded_at, duration_seconds
      FROM recordings WHERE metadata->>'topics' ILIKE ${'%' + project + '%'}
      ORDER BY recorded_at DESC LIMIT 5
    `;

    res.json({
      project,
      knowledge: kbEntries,
      actions,
      related_recordings: recordings,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export for Vercel
export default app;
