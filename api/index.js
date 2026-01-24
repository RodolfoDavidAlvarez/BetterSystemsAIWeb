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
import { users } from '../db/schema.js';

const app = express();

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

    // Find user by username
    const foundUsers = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (foundUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = foundUsers[0];

    // Compare passwords
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

// Export for Vercel
export default app;
