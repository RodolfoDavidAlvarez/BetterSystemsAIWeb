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
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for contacting Better Systems AI!</h2>
      <p>Dear ${name},</p>
      <p>We have received your ${formType} submission. Our team will review your information and get back to you within 1-2 business days.</p>
      <p>If you have any urgent questions, please don't hesitate to call us at (928) 550-1649.</p>
      <br>
      <p>Best regards,<br>The Better Systems AI Team</p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
      to: email,
      subject: `Thank you for your ${formType} submission`,
      html: htmlContent,
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending customer email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNotification(data: EmailData) {
  const { name, email, phone, company, formType, ...otherData } = data;
  
  let detailsHtml = '';
  Object.entries(otherData).forEach(([key, value]) => {
    if (value) {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      detailsHtml += `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>${formattedKey}:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${value}</td></tr>`;
    }
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #333;">New ${formType} Submission</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
        </tr>
        ${phone ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phone}</td></tr>` : ''}
        ${company ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${company}</td></tr>` : ''}
        ${detailsHtml}
      </table>
      <p style="margin-top: 20px;">This submission has also been saved to Airtable.</p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Better Systems AI <noreply@bettersystemsai.com>',
      to: process.env.EMAIL_TO || 'contact@bettersystemsai.com',
      subject: `New ${formType} submission from ${name}`,
      html: htmlContent,
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error };
  }
}