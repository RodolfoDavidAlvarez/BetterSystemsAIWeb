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
import multer from 'multer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// drizzle removed — using raw postgres.js (queryClient) for all queries
const app = express();

// Database connection (postgres.js for raw SQL)
// Note: Supabase pooler ignores search_path options, so auth queries use bettersystems.users explicitly
const queryClient = postgres(process.env.DATABASE_URL);

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
app.use((req, res, next) => {
  // Skip JSON parsing for Stripe webhook (needs raw body for signature verification)
  if (req.path === '/api/webhooks/stripe') return next();
  express.json({ limit: '10mb' })(req, res, next);
});
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

// ==================== AUDIO PROXY (VPS) ====================
// Proxies audio files from VPS to avoid mixed-content (HTTP→HTTPS) browser blocks
app.get('/api/audio/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename.match(/^[a-zA-Z0-9_-]+\.mp3$/)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    // Redirect to Supabase Storage public URL (no VPS needed)
    const supabaseUrl = `https://nnkuwtfktblqlfjugnrj.supabase.co/storage/v1/object/public/plaud-audio/${filename}`;
    res.redirect(301, supabaseUrl);
  } catch (error) {
    console.error('Audio redirect error:', error.message);
    res.status(500).json({ error: 'Failed to serve audio' });
  }
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

    // Find user by username (raw SQL — no Drizzle schema needed)
    const foundUsers = await queryClient`SELECT id, username, password, name, email, role FROM bettersystems.users WHERE username = ${username} LIMIT 1`;

    if (foundUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = foundUsers[0];

    // Compare passwords
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = createAuthToken({
      id: user.id,
      username: user.username,
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
        username: user.username,
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
    const existingUser = await queryClient`SELECT id FROM bettersystems.users WHERE username = ${username} LIMIT 1`;

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Insert new user
    const newUser = await queryClient`
      INSERT INTO bettersystems.users (username, password, name, email, role)
      VALUES (${username}, ${hashedPassword}, ${name}, ${email}, 'admin')
      RETURNING id, username, name, email, role
    `;

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
    const foundUsers = await queryClient`SELECT id, username, name, email, role FROM bettersystems.users WHERE id = ${decoded.id} LIMIT 1`;

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
    console.error('Get current user error:', error.name, error.message);
    console.error('Auth debug — token found:', !!token, '| token length:', token ? token.length : 0);
    console.error('Auth debug — JWT_SECRET source:', process.env.JWT_SECRET ? 'env' : 'fallback');
    if (error.name === 'JsonWebTokenError') {
      console.error('Auth debug — JWT error detail:', error.message);
    } else if (error.name === 'TokenExpiredError') {
      console.error('Auth debug — token expired at:', error.expiredAt);
    }
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
  "BSA-2026-006": {
    invoiceNumber: "BSA-2026-006",
    clientName: "Brian Mitchell",
    projectName: "Mitch's Map — Phase 2 Development",
    issuedDate: "April 15, 2026",
    dueDate: "April 28, 2026",
    subtotal: 1955.00,
    fullTotal: 1955.00,
    discountPercent: 0,
    discountDeadline: "2026-04-28T23:59:59-07:00",
    discountPaymentUrl: "https://invoice.stripe.com/i/acct_1OBpTYLe9qCZBeeN/live_YWNjdF8xT0JwVFlMZTlxQ1pCZWVOLF9VTGNhRWQ2eUpiekZvV3ZUZ1l5anJ4RzhTUU9yTklyLDE2NjkwNzU2Nw0200rwDsEuGl?s=ap",
    fullPaymentUrl: "https://invoice.stripe.com/i/acct_1OBpTYLe9qCZBeeN/live_YWNjdF8xT0JwVFlMZTlxQ1pCZWVOLF9VTGNhRWQ2eUpiekZvV3ZUZ1l5anJ4RzhTUU9yTklyLDE2NjkwNzU2Nw0200rwDsEuGl?s=ap",
    lineItems: [
      { description: "2.1.1 — Rebrand to Mitch's Map", detail: "Logo, royal blue scheme, REALTOR header, stacked brokerage, splash screen, favicon, app icons, SEO meta tags", amount: 340.00 },
      { description: "2.1.2 — Legal & Compliance", detail: "Footer security bar, Terms & Conditions page, Privacy Policy, SMS/TCPA Policy, Equal Housing Opportunity page", amount: 340.00 },
      { description: "2.1.3 — Contact Form Redesign", detail: "Pill-button questions, SMS consent checkbox, compact no-scroll layout, lead notification emails", amount: 212.50 },
      { description: "2.1.4 — Mobile Optimization", detail: "Footer/control layering, safe areas, iPhone notch support, multi-device QA", amount: 127.50 },
      { description: "2.2.1 — Marker Clustering", detail: "Grouped pins with branded icons, expand on zoom, click to break apart", amount: 170.00 },
      { description: "2.2.2 — Smart Zoom Navigation", detail: "Auto-switch community/builder views, tuned thresholds, removed old back button", amount: 170.00 },
      { description: "2.2.3 — Builder Detail View Redesign", detail: "No-scroll sheet, model pill switching with video + stats, amenity overlay", amount: 255.00 },
      { description: "2.2.4 — Amenity Filter", detail: "7 types (Pool, Gym, Park, Trail, Tennis, Pickleball, Community Center), badge count, builder matching", amount: 170.00 },
      { description: "2.2.5 — Community Flag Markers", detail: "Flag design with community name, builder count, price range on satellite view", amount: 63.75 },
      { description: "2.2.6 — Community Name Label & Amenity Pins", detail: "Location indicator, text-only amenity pills", amount: 42.50 },
      { description: "2.3.1 — Builder Compliance & Disclosures", detail: "Homes built by [Builder], Buyer representation available, Brian Mitchell REALTOR text", amount: 63.75 },
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

// ==================== BOOKING ROUTES ====================

// Submit a booking
app.post('/api/book', async (req, res) => {
  try {
    const { date, time, name, email, company, interest, notes } = req.body;

    if (!date || !time || !name || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields: date, time, name, email' });
    }

    // Save to database
    let bookingRecord;
    try {
      const result = await queryClient`
        INSERT INTO bookings (date, time, name, email, company, interest, notes, status, confirmation_sent)
        VALUES (${date}, ${time}, ${name}, ${email}, ${company || null}, ${interest || null}, ${notes || null}, 'pending', true)
        RETURNING id
      `;
      bookingRecord = result[0];
    } catch (dbError) {
      console.error('Database save failed:', dbError);
    }

    // Save to Airtable as backup
    try {
      await base(process.env.AIRTABLE_TABLE_NAME).create({
        'Form Type': 'Discovery Call Booking',
        'Submitted At': new Date().toISOString(),
        'Status': 'New',
        'Name': name,
        'Email': email,
        'Company': company || '',
        'Additional Notes': `Date: ${date}, Time: ${time}, Interest: ${interest || 'N/A'}${notes ? ', Notes: ' + notes : ''}`,
        'Form Data': JSON.stringify({ date, time, name, email, company, interest, notes, formType: 'Discovery Call Booking' })
      });
    } catch (airtableErr) {
      console.error('Airtable save failed:', airtableErr);
    }

    // Format for display
    const bookingDate = new Date(date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum;
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayTime = `${displayHour}:${minute} ${ampm}`;

    // Send confirmation email to customer
    try {
      await resend.emails.send({
        from: 'Better Systems AI <info@bettersystems.ai>',
        to: email,
        subject: `Discovery Call Confirmed - ${formattedDate} at ${displayTime}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0a0f1a;color:#fff;padding:40px;border-radius:16px;">
          <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#fff;margin:0;font-size:28px;">Your Call is Booked!</h1><p style="color:#94a3b8;margin-top:8px;">Discovery Call with Better Systems AI</p></div>
          <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;">
            <p style="color:#60a5fa;font-size:14px;margin:0 0 8px 0;">SCHEDULED FOR</p>
            <p style="color:#fff;font-size:24px;font-weight:bold;margin:0;">${formattedDate}</p>
            <p style="color:#fff;font-size:20px;margin:8px 0 0 0;">${displayTime} (Arizona Time)</p>
          </div>
          <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin-bottom:20px;">
            <h2 style="color:#60a5fa;margin:0 0 16px 0;font-size:18px;">What to Expect</h2>
            <ul style="color:#fff;margin:0;padding-left:20px;line-height:1.8;"><li>15-minute discovery call</li><li>We'll discuss your business automation needs</li><li>You'll receive a follow-up with recommendations</li></ul>
          </div>
          <div style="background:rgba(96,165,250,0.1);border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid rgba(96,165,250,0.3);">
            <p style="color:#60a5fa;margin:0;font-size:14px;"><strong>Note:</strong> You'll receive a calendar invite with the meeting link shortly before your call.</p>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin-top:30px;">Better Systems AI | bettersystems.ai</p>
        </div>`
      });
    } catch (emailError) {
      console.error('Failed to send customer confirmation:', emailError);
    }

    // Send admin notification
    try {
      await resend.emails.send({
        from: 'Better Systems AI <info@bettersystems.ai>',
        to: 'rodolfo@bettersystems.ai',
        subject: `[BOOKING] ${name} - ${formattedDate} at ${displayTime}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0a0f1a;color:#fff;padding:40px;border-radius:16px;">
          <h1 style="color:#fff;margin:0 0 20px;font-size:28px;text-align:center;">New Discovery Call Booked!</h1>
          <div style="background:rgba(34,197,94,0.1);border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid rgba(34,197,94,0.3);text-align:center;">
            <p style="color:#22c55e;font-size:24px;font-weight:bold;margin:0;">${formattedDate}</p>
            <p style="color:#22c55e;font-size:20px;margin:8px 0 0 0;">${displayTime}</p>
          </div>
          <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin-bottom:20px;">
            <h2 style="color:#60a5fa;margin:0 0 16px 0;font-size:18px;">Contact Details</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#94a3b8;padding:8px 0;width:120px;">Name:</td><td style="color:#fff;padding:8px 0;"><strong>${name}</strong></td></tr>
              <tr><td style="color:#94a3b8;padding:8px 0;">Email:</td><td style="color:#fff;padding:8px 0;"><a href="mailto:${email}" style="color:#60a5fa;">${email}</a></td></tr>
              <tr><td style="color:#94a3b8;padding:8px 0;">Company:</td><td style="color:#fff;padding:8px 0;">${company || 'Not provided'}</td></tr>
              <tr><td style="color:#94a3b8;padding:8px 0;">Interest:</td><td style="color:#fff;padding:8px 0;">${interest || 'Not specified'}</td></tr>
            </table>
          </div>
          ${notes ? `<div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:24px;margin-bottom:20px;"><h2 style="color:#60a5fa;margin:0 0 16px 0;font-size:18px;">Notes</h2><p style="color:#fff;margin:0;white-space:pre-wrap;">${notes}</p></div>` : ''}
          <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;"><p style="color:#94a3b8;margin:0;font-size:14px;">Remember to send a calendar invite with meeting link!</p></div>
        </div>`
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    res.json({ success: true, message: 'Your discovery call has been booked successfully.', bookingId: bookingRecord?.id });
  } catch (error) {
    console.error('Booking API error:', error);
    res.status(500).json({ success: false, message: 'Failed to process your booking. Please try again.' });
  }
});

// Get booked slots for availability
app.get('/api/bookings/slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const bookedSlots = await queryClient`
      SELECT time FROM bookings WHERE date = ${date} AND status != 'cancelled'
    `;
    res.json({ success: true, date, bookedTimes: bookedSlots.map(s => s.time) });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability.' });
  }
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

// ==================== CONTRACTOR INQUIRY ====================
app.post('/api/contractor-inquiry', async (req, res) => {
  try {
    const { name, email, company, phone, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email required' });
    }

    // Insert into leads table
    await queryClient`
      INSERT INTO leads (first_name, last_name, email, phone, company, source, status, tags)
      VALUES (
        ${name.split(' ')[0] || name},
        ${name.split(' ').slice(1).join(' ') || null},
        ${email},
        ${phone || null},
        ${company || null},
        'website',
        'new',
        ${'{"contractor_page"}'}
      )
      ON CONFLICT (email) DO UPDATE SET
        updated_at = NOW(),
        tags = CASE WHEN NOT ('contractor_page' = ANY(leads.tags)) THEN array_append(leads.tags, 'contractor_page') ELSE leads.tags END
    `;

    // Notify Rodo via Resend
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
        to: 'rodolfo@bettersystems.ai',
        subject: `🎯 Contractor CRM Inquiry: ${name}${company ? ` (${company})` : ''}`,
        text: `New contractor inquiry from ${name}\nEmail: ${email}\nCompany: ${company || 'N/A'}\nPhone: ${phone || 'N/A'}\nMessage: ${message || 'N/A'}\n\nSource: /contractors landing page`,
      });
    } catch (emailErr) {
      console.error('[Contractor Inquiry] Email notification failed:', emailErr.message);
    }

    res.json({ success: true, message: 'Inquiry received' });
  } catch (error) {
    console.error('[Contractor Inquiry] Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to process inquiry' });
  }
});

// ==================== RESEND WEBHOOK (bounce/delivery tracking) ====================
app.post('/api/webhooks/resend', async (req, res) => {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const svixId = req.headers['svix-id'];
      const svixTimestamp = req.headers['svix-timestamp'];
      const svixSignature = req.headers['svix-signature'];
      if (!svixId || !svixTimestamp || !svixSignature) {
        console.log('[Resend Webhook] Missing signature headers');
        return res.status(401).json({ error: 'Missing signature' });
      }
    }

    const { type, data } = req.body;
    const recipient = data?.to?.[0] || data?.email || null;

    console.log(`[Resend Webhook] ${type} for ${recipient}`);

    if (!recipient) {
      return res.json({ success: true, skipped: true, reason: 'no_recipient' });
    }

    if (type === 'email.bounced' || type === 'email.complained') {
      // Mark lead as bounced
      const result = await queryClient`
        UPDATE leads SET status = 'bounced', updated_at = NOW()
        WHERE email = ${recipient} AND status != 'bounced'
      `;
      console.log(`[Resend Webhook] Marked ${recipient} as bounced (${result.count} rows)`);
    } else if (type === 'email.delivered') {
      console.log(`[Resend Webhook] Delivered to ${recipient}`);
    } else if (type === 'email.opened') {
      console.log(`[Resend Webhook] Opened by ${recipient}`);
    }

    res.json({ success: true, type, recipient });
  } catch (error) {
    console.error('[Resend Webhook] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== STRIPE WEBHOOK (payment notifications) ====================
app.post('/api/webhooks/stripe', express.raw({type: '*/*'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (!sig) {
      // Allow unsigned requests for testing (Stripe always sends signature in production)
      const raw = Buffer.isBuffer(req.body) ? req.body.toString() : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      event = JSON.parse(raw);
    } else {
      event = JSON.parse(req.body.toString());
    }

    const paymentEvents = ['charge.succeeded', 'payment_intent.succeeded', 'invoice.paid', 'invoice.payment_succeeded', 'checkout.session.completed'];
    if (paymentEvents.includes(event.type)) {
      const obj = event.data.object;
      // Handle different event shapes
      const amount = (obj.amount || obj.amount_received || obj.amount_paid || obj.amount_total || 0) / 100;
      const name = obj.billing_details?.name || obj.customer_name || obj.customer_details?.name || obj.customer_email || obj.description || 'Unknown';
      const email = obj.billing_details?.email || obj.receipt_email || obj.customer_email || obj.customer_details?.email || '';
      const date = new Date(obj.created * 1000).toLocaleDateString('en-US', { timeZone: 'America/Phoenix' });

      // Skip tiny charges (Stripe App fees, test charges)
      if (amount < 50) {
        return res.json({ received: true, skipped: 'small_amount' });
      }

      const message = `Payment received: $${amount.toFixed(2)} from ${name}${email ? ' (' + email + ')' : ''} on ${date}`;
      console.log(`[Stripe Webhook] ${message}`);

      // Send SMS to Rodo
      try {
        const twilio = (await import('twilio')).default;
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: '+19285501649'
        });
        console.log('[Stripe Webhook] SMS sent to Rodo');
      } catch (smsErr) {
        console.error('[Stripe Webhook] SMS failed:', smsErr.message);
      }

      // Send email to Rodo
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'BSA Payments <accounting@bettersystems.ai>',
          to: 'rodolfo@bettersystems.ai',
          subject: `Payment: $${amount.toFixed(2)} from ${name}`,
          text: `${message}\n\nStripe Dashboard: https://dashboard.stripe.com/payments/${obj.id || obj.latest_charge || ''}`
        });
        console.log('[Stripe Webhook] Email sent to Rodo');
      } catch (emailErr) {
        console.error('[Stripe Webhook] Email failed:', emailErr.message);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==================== NEW LEADS PIPELINE (admin) ====================
app.get('/api/admin/cold-outreach/new-leads', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    jwt.verify(token, JWT_SECRET);

    const campaign = req.query.campaign || null;

    const leads = campaign
      ? await queryClient`
          SELECT id, first_name, last_name, email, phone, title, company, company_website,
                 industry, city, state, employee_count, source, status, outreach_step,
                 last_email_sent, notes, campaign, resend_message_id, tags, created_at, updated_at
          FROM leads
          WHERE campaign = ${campaign}
          ORDER BY
            CASE
              WHEN status = 'replied' THEN 1
              WHEN status = 'contacted' AND outreach_step < 3 THEN 2
              WHEN status = 'new' THEN 3
              WHEN status = 'bounced' THEN 4
              ELSE 5
            END,
            last_email_sent DESC NULLS LAST,
            created_at DESC
        `
      : await queryClient`
          SELECT id, first_name, last_name, email, phone, title, company, company_website,
                 industry, city, state, employee_count, source, status, outreach_step,
                 last_email_sent, notes, campaign, resend_message_id, tags, created_at, updated_at
          FROM leads
          ORDER BY
            CASE
              WHEN status = 'replied' THEN 1
              WHEN status = 'contacted' AND outreach_step < 3 THEN 2
              WHEN status = 'new' THEN 3
              WHEN status = 'bounced' THEN 4
              ELSE 5
            END,
            last_email_sent DESC NULLS LAST,
            created_at DESC
        `;

    res.json({ success: true, leads });
  } catch (error) {
    console.error('[New Leads] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/cold-outreach/new-leads/metrics', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    jwt.verify(token, JWT_SECRET);

    const campaign = req.query.campaign || null;

    // Per-campaign metrics
    const campaignMetrics = await queryClient`
      SELECT
        campaign,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
        COUNT(*) FILTER (WHERE status = 'replied') as replied,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
        COUNT(*) FILTER (WHERE outreach_step = 0 AND status NOT IN ('unsubscribed')) as not_emailed,
        COUNT(*) FILTER (WHERE outreach_step = 1) as step_1,
        COUNT(*) FILTER (WHERE outreach_step = 2) as step_2,
        COUNT(*) FILTER (WHERE outreach_step >= 3) as step_3_complete,
        COUNT(*) FILTER (WHERE last_email_sent::date = CURRENT_DATE) as sent_today
      FROM leads
      GROUP BY campaign
    `;

    // If specific campaign requested, return just that one
    if (campaign) {
      const m = campaignMetrics.find(c => c.campaign === campaign) || {
        campaign, total: 0, new_leads: 0, contacted: 0, replied: 0, bounced: 0,
        not_emailed: 0, step_1: 0, step_2: 0, step_3_complete: 0, sent_today: 0
      };
      return res.json({ success: true, metrics: m });
    }

    // Return all campaigns + combined totals
    const combined = {
      total: 0, new_leads: 0, contacted: 0, replied: 0, bounced: 0,
      not_emailed: 0, step_1: 0, step_2: 0, step_3_complete: 0, sent_today: 0
    };
    for (const m of campaignMetrics) {
      for (const key of Object.keys(combined)) {
        combined[key] += Number(m[key]) || 0;
      }
    }

    res.json({ success: true, metrics: combined, by_campaign: campaignMetrics });
  } catch (error) {
    console.error('[New Leads Metrics] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH lead — update status, notes, outreach_step
app.patch('/api/admin/leads/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    jwt.verify(token, JWT_SECRET);

    const { id } = req.params;
    const { status, notes, outreach_step } = req.body;

    const sets = [];
    if (status !== undefined) sets.push({ key: 'status', val: status });
    if (notes !== undefined) sets.push({ key: 'notes', val: notes });
    if (outreach_step !== undefined) sets.push({ key: 'outreach_step', val: outreach_step });

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Build update dynamically
    const [lead] = await queryClient`
      UPDATE leads SET
        status = COALESCE(${status ?? null}, status),
        notes = COALESCE(${notes ?? null}, notes),
        outreach_step = COALESCE(${outreach_step !== undefined ? outreach_step : null}, outreach_step),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, lead });
  } catch (error) {
    console.error('[Leads PATCH] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET lead activity — today's sends + queued next
app.get('/api/admin/leads/activity', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    jwt.verify(token, JWT_SECRET);

    const campaign = req.query.campaign || null;

    const sent_today = campaign
      ? await queryClient`
          SELECT id, first_name, last_name, email, company, state, outreach_step, last_email_sent, campaign
          FROM leads WHERE last_email_sent::date = CURRENT_DATE AND campaign = ${campaign}
          ORDER BY last_email_sent DESC
        `
      : await queryClient`
          SELECT id, first_name, last_name, email, company, state, outreach_step, last_email_sent, campaign
          FROM leads WHERE last_email_sent::date = CURRENT_DATE
          ORDER BY last_email_sent DESC
        `;

    const queued_next = campaign
      ? await queryClient`
          SELECT id, first_name, last_name, email, company, state, outreach_step, campaign
          FROM leads WHERE status = 'new' AND outreach_step = 0 AND campaign = ${campaign}
          ORDER BY CASE WHEN state = 'AZ' THEN 0 ELSE 1 END, employee_count ASC NULLS LAST, created_at ASC
          LIMIT 10
        `
      : await queryClient`
          SELECT id, first_name, last_name, email, company, state, outreach_step, campaign
          FROM leads WHERE status = 'new' AND outreach_step = 0
          ORDER BY CASE WHEN state = 'AZ' THEN 0 ELSE 1 END, employee_count ASC NULLS LAST, created_at ASC
          LIMIT 10
        `;

    res.json({ success: true, sent_today, queued_next });
  } catch (error) {
    console.error('[Leads Activity] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
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
             transcription_status, transcript, summary, metadata, language,
             client_id, deal_id, recording_type, tags, recorded_at, transcribed_at, created_at,
             speakers, topics, people, companies, projects
      FROM recordings
      ORDER BY recorded_at DESC NULLS LAST
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
      WHERE status NOT IN ('needs_review')
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

// ─── Semantic Search API ─────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function getQueryEmbedding(text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
    }),
  });
  const data = await res.json();
  return data.embedding?.values;
}

// Speaker profiles
app.get('/api/admin/speaker-profiles', async (req, res) => {
  try {
    const profiles = await queryClient`
      SELECT id, name, aliases, company, role, topics, vocabulary,
             speaking_style, frequent_contacts, companies_discussed,
             recording_count, total_minutes, first_seen, last_seen,
             confidence_score, metadata
      FROM speaker_profiles
      ORDER BY recording_count DESC, last_seen DESC
    `;
    res.json({ success: true, profiles });
  } catch (error) {
    console.error('[SpeakerProfiles] Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch speaker profiles' });
  }
});

// Semantic search across recordings
app.get('/api/admin/recordings/search/semantic', async (req, res) => {
  try {
    const { q, limit = 20, company, speaker, project } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing q parameter' });
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    const embedding = await getQueryEmbedding(q);
    if (!embedding) return res.status(500).json({ error: 'Failed to generate embedding' });

    const vecStr = `[${embedding.join(',')}]`;
    const lim = Math.min(parseInt(limit) || 20, 50);

    const results = await queryClient`
      SELECT
        rc.id, rc.recording_id, rc.chunk_index, rc.content, rc.speaker,
        rc.topics, rc.company, rc.project, rc.people, rc.metadata,
        r.title as recording_title, r.recorded_at, r.duration_seconds,
        r.speakers as recording_speakers, r.topics as recording_topics,
        r.people as recording_people,
        1 - (rc.embedding <=> ${vecStr}::vector) as similarity
      FROM recording_chunks rc
      JOIN recordings r ON r.id = rc.recording_id
      WHERE (${company || null}::text IS NULL OR rc.company = ${company || null})
        AND (${speaker || null}::text IS NULL OR rc.speaker = ${speaker || null})
        AND (${project || null}::text IS NULL OR rc.project = ${project || null})
      ORDER BY rc.embedding <=> ${vecStr}::vector
      LIMIT ${lim}
    `;

    // Group by recording for a cleaner response
    const grouped = {};
    for (const r of results) {
      const key = r.recording_id;
      if (!grouped[key]) {
        grouped[key] = {
          recording_id: r.recording_id,
          title: r.recording_title,
          recorded_at: r.recorded_at,
          duration_seconds: r.duration_seconds,
          speakers: r.recording_speakers,
          topics: r.recording_topics,
          people: r.recording_people,
          best_similarity: r.similarity,
          chunks: [],
        };
      }
      grouped[key].chunks.push({
        content: r.content,
        speaker: r.speaker,
        similarity: r.similarity,
        chunk_index: r.chunk_index,
      });
    }

    res.json({
      query: q,
      total_chunks: results.length,
      recordings: Object.values(grouped).sort((a, b) => b.best_similarity - a.best_similarity),
    });
  } catch (e) {
    console.error('Semantic search error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Recording stats (indexing progress)
app.get('/api/admin/recordings/search/stats', async (req, res) => {
  try {
    const [counts] = await queryClient`
      SELECT
        (SELECT count(*)::int FROM recordings WHERE transcription_status = 'completed') as total_recordings,
        (SELECT count(*)::int FROM recordings WHERE metadata->>'indexed' = 'true') as indexed_recordings,
        (SELECT count(*)::int FROM recording_chunks) as total_chunks,
        (SELECT count(DISTINCT recording_id)::int FROM recording_chunks) as recordings_with_chunks
    `;

    const topSpeakers = await queryClient`
      SELECT speaker, count(*)::int as chunk_count FROM recording_chunks
      WHERE speaker IS NOT NULL GROUP BY speaker ORDER BY chunk_count DESC LIMIT 15
    `;

    const topTopics = await queryClient`
      SELECT unnest(topics) as topic, count(*)::int as mentions FROM recording_chunks
      WHERE topics IS NOT NULL GROUP BY topic ORDER BY mentions DESC LIMIT 20
    `;

    const recentIndexed = await queryClient`
      SELECT id, title, speakers, topics, people, recorded_at,
        metadata->>'summary' as summary,
        metadata->>'urgency' as urgency,
        metadata->'key_decisions' as decisions,
        metadata->'key_numbers' as numbers,
        metadata->'diarized_segments' as diarized_segments
      FROM recordings
      WHERE metadata->>'indexed' = 'true'
      ORDER BY recorded_at DESC LIMIT 20
    `;

    res.json({
      ...counts,
      top_speakers: topSpeakers,
      top_topics: topTopics,
      recent_indexed: recentIndexed,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ask a question (RAG)
app.post('/api/admin/recordings/search/ask', async (req, res) => {
  try {
    const { question, limit = 8 } = req.body;
    if (!question) return res.status(400).json({ error: 'Missing question' });
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    const embedding = await getQueryEmbedding(question);
    if (!embedding) return res.status(500).json({ error: 'Failed to generate embedding' });

    const vecStr = `[${embedding.join(',')}]`;

    const results = await queryClient`
      SELECT rc.content, rc.speaker, rc.topics, r.title as recording_title, r.recorded_at,
        1 - (rc.embedding <=> ${vecStr}::vector) as similarity
      FROM recording_chunks rc
      JOIN recordings r ON r.id = rc.recording_id
      ORDER BY rc.embedding <=> ${vecStr}::vector
      LIMIT ${parseInt(limit) || 8}
    `;

    // Build context for Gemini
    const context = results.map((r, i) => {
      const date = new Date(r.recorded_at).toLocaleDateString('en-US', { timeZone: 'America/Phoenix' });
      return `--- Source ${i + 1}: ${r.recording_title} (${date}) [${(r.similarity * 100).toFixed(0)}% match] ---\n${r.speaker ? `Speaker: ${r.speaker}\n` : ''}${r.content}`;
    }).join('\n\n');

    const prompt = `You are Rodo Alvarez's AI assistant. Answer this question using ONLY the recording excerpts below. Be specific, cite which recording/date the info comes from. If the answer isn't in the sources, say so.\n\nQUESTION: ${question}\n\nRECORDING EXCERPTS:\n${context}\n\nAnswer concisely with specific facts, names, numbers, and dates from the sources:`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    });
    const geminiData = await geminiRes.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated';

    res.json({
      question,
      answer,
      sources: results.map(r => ({
        title: r.recording_title,
        date: r.recorded_at,
        speaker: r.speaker,
        similarity: r.similarity,
        excerpt: r.content.substring(0, 200),
      })),
    });
  } catch (e) {
    console.error('Ask error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== PRESENTATION LEADS ====================
app.post('/api/presentation-leads', async (req, res) => {
  try {
    const { name, email, phone, category, interestedInHelp, presentation } = req.body;

    if (!name || !email || !category) {
      return res.status(400).json({ error: 'Name, email, and category are required' });
    }

    // Store in database
    await queryClient`
      INSERT INTO presentation_leads (name, email, phone, category, interested_in_help, presentation)
      VALUES (${name}, ${email}, ${phone || null}, ${category}, ${interestedInHelp || false}, ${presentation || 'cgcc-ai-2026'})
    `;

    // Send notification email via Resend
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Better Systems AI <developer@bettersystems.ai>',
        to: 'rodolfo@bettersystems.ai',
        subject: `New Presentation Lead: ${name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
            <h1 style="color: #fff; margin: 0 0 8px 0; font-size: 24px;">New Presentation Lead</h1>
            <p style="color: #94a3b8; margin: 0 0 24px 0;">Someone downloaded the AI presentation</p>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #94a3b8; padding: 8px 0;">Name</td><td style="color: #fff; padding: 8px 0; text-align: right;"><strong>${name}</strong></td></tr>
                <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #fff; padding: 8px 0; text-align: right;"><a href="mailto:${email}" style="color: #60a5fa;">${email}</a></td></tr>
                <tr><td style="color: #94a3b8; padding: 8px 0;">Phone</td><td style="color: #fff; padding: 8px 0; text-align: right;">${phone || 'Not provided'}</td></tr>
                <tr><td style="color: #94a3b8; padding: 8px 0;">Category</td><td style="color: #fff; padding: 8px 0; text-align: right;">${category}</td></tr>
                <tr><td style="color: #94a3b8; padding: 8px 0;">Wants AI Help</td><td style="color: #fff; padding: 8px 0; text-align: right;">${interestedInHelp ? '<span style="color: #22c55e; font-weight: bold;">YES</span>' : 'No'}</td></tr>
                <tr><td style="color: #94a3b8; padding: 8px 0;">Presentation</td><td style="color: #fff; padding: 8px 0; text-align: right;">${presentation || 'cgcc-ai-2026'}</td></tr>
                <tr><td style="color: #94a3b8; padding: 8px 0;">Submitted</td><td style="color: #fff; padding: 8px 0; text-align: right;">${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })}</td></tr>
              </table>
            </div>
            ${interestedInHelp ? '<div style="margin-top: 16px; padding: 12px 16px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; color: #22c55e; font-weight: 600; text-align: center;">This person wants help integrating AI systems</div>' : ''}
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send presentation lead notification:', emailErr);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Presentation lead error:', error);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

// ==================== DEV TRACKER ====================
// Feature: /admin/dev-tracker — role-gated project tracker backed by qa_items + qa_notes.
// Roles: owner = full CRUD, developer = read + update status + add/resolve notes.

// Supabase Storage client (used for dev-tracker attachments)
const supabaseStorage = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;
const ATTACHMENTS_BUCKET = 'dev-tracker-attachments';
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function devTrackerAuth(requiredRoles) {
  return async (req, res, next) => {
    try {
      let token;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
      else if (req.cookies && req.cookies.token) token = req.cookies.token;
      if (!token) return res.status(401).json({ error: 'Authentication required' });

      const decoded = jwt.verify(token, JWT_SECRET);
      const rows = await queryClient`SELECT id, username, name, email, role FROM bettersystems.users WHERE id = ${decoded.id} LIMIT 1`;
      if (!rows.length) return res.status(401).json({ error: 'User not found' });
      const user = rows[0];
      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden', role: user.role });
      }
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

app.get('/api/dev-tracker/items', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const project = req.query.project;
    // Single tracker view — developers see ALL items (full context, same as admin).
    // Write access is gated separately in PATCH/DELETE handlers.
    const items = project
      ? await queryClient`SELECT * FROM qa_items WHERE project = ${project} ORDER BY version DESC, sort_order ASC, created_at ASC`
      : await queryClient`SELECT * FROM qa_items ORDER BY version DESC, sort_order ASC, created_at ASC`;
    if (!items.length) return res.json(project ? [] : {});
    const ids = items.map(i => i.id);
    const notes = await queryClient`SELECT * FROM qa_notes WHERE item_id IN ${queryClient(ids)} ORDER BY created_at ASC`;
    const byItem = new Map();
    for (const n of notes) {
      const arr = byItem.get(n.item_id) || [];
      arr.push(n);
      byItem.set(n.item_id, arr);
    }
    // Attachments
    const attachments = await queryClient`SELECT * FROM qa_attachments WHERE item_id IN ${queryClient(ids)} ORDER BY created_at ASC`;
    const attByItem = new Map();
    for (const a of attachments) {
      const arr = attByItem.get(a.item_id) || [];
      arr.push(a);
      attByItem.set(a.item_id, arr);
    }
    if (project) {
      return res.json(items.map(it => ({ ...it, notes: byItem.get(it.id) || [], attachments: attByItem.get(it.id) || [] })));
    }
    const projects = {};
    for (const it of items) {
      const key = it.project;
      if (!projects[key]) projects[key] = [];
      projects[key].push({ ...it, notes: byItem.get(it.id) || [], attachments: attByItem.get(it.id) || [] });
    }
    res.json(projects);
  } catch (e) {
    console.error('dev-tracker items error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/dev-tracker/invoices', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const project = req.query.project;
    const invoices = project
      ? await queryClient`SELECT * FROM qa_invoices WHERE project = ${project} ORDER BY issued_date DESC`
      : await queryClient`SELECT * FROM qa_invoices ORDER BY issued_date DESC`;
    if (!invoices.length) return res.json([]);
    const linkedAll = project
      ? await queryClient`SELECT id, invoice_number, bundle, title, version, status, sort_order, paid_at, invoiced_at FROM qa_items WHERE invoice_number IS NOT NULL AND project = ${project} ORDER BY invoice_number, bundle NULLS LAST, sort_order`
      : await queryClient`SELECT id, invoice_number, bundle, title, version, status, sort_order, paid_at, invoiced_at FROM qa_items WHERE invoice_number IS NOT NULL ORDER BY invoice_number, bundle NULLS LAST, sort_order`;
    const grouped = {};
    for (const it of linkedAll) {
      if (!grouped[it.invoice_number]) grouped[it.invoice_number] = [];
      grouped[it.invoice_number].push(it);
    }
    res.json(invoices.map(inv => ({ ...inv, linked_items: grouped[inv.invoice_number] || [] })));
  } catch (e) {
    console.error('dev-tracker invoices error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/dev-tracker/projects', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const rows = await queryClient`SELECT project, COUNT(*)::int AS count FROM qa_items GROUP BY project ORDER BY project`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/dev-tracker/items', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const b = req.body || {};
    const [row] = await queryClient`
      INSERT INTO qa_items (project, version, category, title, description, source, source_date, status, sort_order, assignee)
      VALUES (${b.project || 'mitchs-map'}, ${b.version || '2.4'}, ${b.category || 'feature'},
              ${b.title || 'Untitled'}, ${b.description || null}, ${b.source || null}, ${b.source_date || null},
              ${b.status || 'open'}, ${b.sort_order ?? 0}, ${b.assignee || null})
      RETURNING *
    `;
    res.json({ ...row, notes: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/dev-tracker/items/:id', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};
    // Single tracker — every signed-in user can edit any field.
    const allowed = [
      'status', 'version', 'category', 'title', 'description', 'charged', 'commit_hash', 'amount_cents',
      'source', 'source_date', 'source_context', 'source_ref', 'sort_order', 'assignee',
      'delivered_at', 'invoiced_at', 'paid_at', 'invoice_number', 'bundle', 'stripe_charge_id',
    ];
    const updates = {};
    for (const k of allowed) if (k in b) updates[k] = b[k];
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields' });
    if (b.status === 'tested_pass' || b.status === 'tested_fail') updates.tested_at = new Date();
    if (b.status === 'shipped' && !b.deployed_at) updates.deployed_at = new Date();
    updates.updated_at = new Date();
    const [row] = await queryClient`UPDATE qa_items SET ${queryClient(updates)} WHERE id = ${id} RETURNING *`;
    const notes = await queryClient`SELECT * FROM qa_notes WHERE item_id = ${id} ORDER BY created_at ASC`;
    res.json({ ...row, notes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/dev-tracker/items/:id', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    // Single tracker — every signed-in user can delete any item.
    await queryClient`DELETE FROM qa_items WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Attachments — drag/drop files (images, screenshots, videos, docs) ===
app.post(
  '/api/dev-tracker/items/:id/attachments',
  devTrackerAuth(['owner', 'admin', 'developer']),
  attachmentUpload.array('files', 10),
  async (req, res) => {
    try {
      if (!supabaseStorage) return res.status(503).json({ error: 'Storage not configured' });
      const itemId = req.params.id;
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

      // Verify item exists. Single tracker — anyone signed in can attach to anything.
      const [itemRow] = await queryClient`SELECT id FROM qa_items WHERE id = ${itemId}`;
      if (!itemRow) return res.status(404).json({ error: 'Item not found' });

      const uploaded = [];
      for (const f of files) {
        const safe = f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${itemId}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabaseStorage.storage
          .from(ATTACHMENTS_BUCKET)
          .upload(storagePath, f.buffer, { contentType: f.mimetype, upsert: false });
        if (upErr) {
          console.error('[Attachment] upload error:', upErr);
          return res.status(500).json({ error: upErr.message });
        }
        const { data: pub } = supabaseStorage.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(storagePath);
        const [row] = await queryClient`
          INSERT INTO qa_attachments (item_id, filename, mime_type, size_bytes, storage_path, public_url, uploaded_by)
          VALUES (${itemId}, ${f.originalname}, ${f.mimetype}, ${f.size}, ${storagePath}, ${pub.publicUrl}, ${req.user.username || 'unknown'})
          RETURNING *
        `;
        uploaded.push(row);
      }
      await queryClient`UPDATE qa_items SET updated_at = NOW() WHERE id = ${itemId}`;
      res.json(uploaded);
    } catch (e) {
      console.error('[Attachment] error:', e);
      res.status(500).json({ error: e.message });
    }
  }
);

app.delete('/api/dev-tracker/attachments/:id', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    if (!supabaseStorage) return res.status(503).json({ error: 'Storage not configured' });
    const id = req.params.id;
    const [att] = await queryClient`SELECT * FROM qa_attachments WHERE id = ${id}`;
    if (!att) return res.status(404).json({ error: 'Not found' });
    // Single tracker — anyone signed in can delete attachments
    const { error: delErr } = await supabaseStorage.storage.from(ATTACHMENTS_BUCKET).remove([att.storage_path]);
    if (delErr) console.warn('[Attachment] storage delete failed (continuing):', delErr.message);
    await queryClient`DELETE FROM qa_attachments WHERE id = ${id}`;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Convenience: mark an item paid (sets paid_at + optional invoice/charge refs)
app.post('/api/dev-tracker/items/:id/mark-paid', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};
    const updates = {
      paid_at: new Date(),
      updated_at: new Date(),
    };
    if (b.invoice_number) updates.invoice_number = b.invoice_number;
    if (b.stripe_charge_id) updates.stripe_charge_id = b.stripe_charge_id;
    // Ensure invoiced_at is also set (you can't pay without invoicing)
    const [existing] = await queryClient`SELECT invoiced_at FROM qa_items WHERE id = ${id}`;
    if (existing && !existing.invoiced_at) updates.invoiced_at = new Date();
    const [row] = await queryClient`UPDATE qa_items SET ${queryClient(updates)} WHERE id = ${id} RETURNING *`;
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/dev-tracker/items/:id/notes', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};
    const author = req.user.username || req.user.name || 'unknown';
    const [n] = await queryClient`
      INSERT INTO qa_notes (item_id, text, author)
      VALUES (${id}, ${b.text || ''}, ${author})
      RETURNING *
    `;
    await queryClient`UPDATE qa_items SET updated_at = now() WHERE id = ${id}`;
    res.json(n);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/dev-tracker/items/:id/notes/:noteId', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const { noteId } = req.params;
    const b = req.body || {};
    const updates = {};
    if ('text' in b) updates.text = b.text;
    if (b.resolved === true) {
      updates.resolved_at = new Date();
      updates.resolved_by = req.user.username || 'unknown';
    }
    if (b.resolved === false) {
      updates.resolved_at = null;
      updates.resolved_by = null;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updates' });
    const [row] = await queryClient`UPDATE qa_notes SET ${queryClient(updates)} WHERE id = ${noteId} RETURNING *`;
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === User management (admin only) ===
app.get('/api/dev-tracker/users', devTrackerAuth(['owner', 'admin', 'developer']), async (_req, res) => {
  try {
    const rows = await queryClient`SELECT id, username, name, email, role, "createdAt" FROM bettersystems.users ORDER BY id`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/dev-tracker/users', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.username || !b.name || !b.email || !b.password) {
      return res.status(400).json({ error: 'Missing required fields: username, name, email, password' });
    }
    const role = ['developer', 'admin', 'owner'].includes(b.role) ? b.role : 'developer';
    const hash = bcrypt.hashSync(b.password, 10);
    const [row] = await queryClient`
      INSERT INTO bettersystems.users (username, name, email, password, role)
      VALUES (${b.username}, ${b.name}, ${b.email}, ${hash}, ${role})
      RETURNING id, username, name, email, role, "createdAt"
    `;
    res.json(row);
  } catch (e) {
    if (String(e.message).includes('duplicate')) return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/dev-tracker/users/:id', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const updates = {};
    if (b.name) updates.name = b.name;
    if (b.email) updates.email = b.email;
    if (b.role && ['developer', 'admin', 'owner'].includes(b.role)) updates.role = b.role;
    if (b.password) updates.password = bcrypt.hashSync(b.password, 10);
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updates' });
    updates.updatedAt = new Date();
    const [row] = await queryClient`UPDATE bettersystems.users SET ${queryClient(updates)} WHERE id = ${id} RETURNING id, username, name, email, role`;
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/dev-tracker/users/:id', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.user.id === id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await queryClient`UPDATE qa_items SET assignee = NULL WHERE assignee IN (SELECT username FROM bettersystems.users WHERE id = ${id})`;
    await queryClient`DELETE FROM bettersystems.users WHERE id = ${id}`;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dev-tracker/unresolved', devTrackerAuth(['owner', 'admin', 'developer']), async (req, res) => {
  try {
    const project = req.query.project || 'mitchs-map';
    const rows = await queryClient`
      SELECT n.id AS note_id, n.text, n.created_at AS note_created_at,
             i.id AS item_id, i.title, i.version, i.status
      FROM qa_notes n
      JOIN qa_items i ON i.id = n.item_id
      WHERE n.resolved_at IS NULL AND i.project = ${project}
      ORDER BY n.created_at ASC
    `;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export for Vercel
export default app;
