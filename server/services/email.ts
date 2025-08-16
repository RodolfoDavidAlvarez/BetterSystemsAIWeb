import { Resend } from 'resend';

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('[Email Service] ERROR: RESEND_API_KEY is not set in environment variables');
  throw new Error('RESEND_API_KEY is required for email service');
}

const resend = new Resend(resendApiKey);
console.log('[Email Service] Initialized with Resend API');

interface EmailData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  formType: string;
  [key: string]: any;
}

export async function sendCustomerEmail(data: EmailData) {
  const { email, name, formType } = data;
  
  let htmlContent = '';
  let subject = '';
  
  if (formType === 'Client Onboarding') {
    subject = 'Welcome to Better Systems AI - Onboarding Received';
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285F4;">Welcome aboard! 🎉</h2>
        <p>Hi ${name},</p>
        <p>Thank you for completing your onboarding information. We're excited to begin this partnership!</p>
        <h3>What happens next?</h3>
        <ul>
          <li>Our team will review your information within 24 hours</li>
          <li>We'll schedule a kickoff meeting to discuss your specific needs</li>
          <li>Begin customizing your AI solution</li>
          <li>Start your journey to 90% cost reduction!</li>
        </ul>
        <p>If you have any immediate questions, feel free to reach out.</p>
        <p>Best regards,<br>The Better Systems AI Team</p>
      </div>
    `;
  } else {
    subject = `Thank you for your ${formType} submission`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285F4;">Got it! We'll be in touch soon.</h2>
        <p>Hi ${name},</p>
        <p>Thanks for reaching out! We'll review your message and get back to you within 24 hours.</p>
        <p>Talk soon!<br>Better Systems AI</p>
      </div>
    `;
  }

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
      to: email,
      subject: subject,
      html: htmlContent,
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending customer email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNotification(data: EmailData) {
  const { formType } = data;

  let htmlContent = '';
  let subjectLine = '';

  if (formType === 'Client Onboarding') {
    // Client Onboarding specific email template
    subjectLine = `New Client Onboarding: ${data.businessName || 'Unknown Business'}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285F4;">New Client Onboarding Submission</h2>
        
        <h3>Business Information</h3>
        <p><strong>Business Name:</strong> ${data.businessName || 'Not provided'}</p>
        <p><strong>Legal Business Name:</strong> ${data.legalBusinessName || 'Not provided'}</p>
        <p><strong>Business Address:</strong> ${data.businessAddress || 'Not provided'}</p>
        <p><strong>Business Phone:</strong> ${data.businessPhone || 'Not provided'}</p>
        <p><strong>Website:</strong> ${data.website || 'Not provided'}</p>
        
        <h3>Primary Contact</h3>
        <p><strong>Name:</strong> ${data.primaryContactName || 'Not provided'}</p>
        <p><strong>Title:</strong> ${data.primaryContactTitle || 'Not provided'}</p>
        <p><strong>Email:</strong> ${data.primaryContactEmail || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${data.primaryContactPhone || 'Not provided'}</p>
        
        <h3>Operations Contact</h3>
        <p><strong>Name:</strong> ${data.operationsContactName || 'Not provided'}</p>
        <p><strong>Title:</strong> ${data.operationsContactTitle || 'Not provided'}</p>
        <p><strong>Email:</strong> ${data.operationsContactEmail || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${data.operationsContactPhone || 'Not provided'}</p>
        
        <h3>Billing Contact</h3>
        <p><strong>Name:</strong> ${data.billingContactName || 'Not provided'}</p>
        <p><strong>Title:</strong> ${data.billingContactTitle || 'Not provided'}</p>
        <p><strong>Email:</strong> ${data.billingContactEmail || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${data.billingContactPhone || 'Not provided'}</p>
        
        <h3>Additional Information</h3>
        <p><strong>Notes:</strong> ${data.additionalNotes || 'None provided'}</p>
        
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Submitted at: ${data.submittedAt || new Date().toISOString()}</p>
      </div>
    `;
  } else {
    // Default contact form template
    const { name, email, phone, message } = data;
    subjectLine = `New ${formType} submission from ${name}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285F4;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong><br>${message || 'No message'}</p>
      </div>
    `;
  }

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
      to: process.env.EMAIL_TO || 'contact@bettersystemsai.com',
      subject: subjectLine,
      html: htmlContent,
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error };
  }
}