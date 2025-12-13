import { Resend } from "resend";
import { db } from "@db/index";
import { emailLogs } from "@db/schema";

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error("[Email Service] ERROR: RESEND_API_KEY is not set in environment variables");
  throw new Error("RESEND_API_KEY is required for email service");
}

const resend = new Resend(resendApiKey);
console.log("[Email Service] Initialized with Resend API");

interface EmailData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  companyExpertise?: string;
  notes?: string;
  message?: string;
  formType: string;
  [key: string]: any;
}

export async function sendCustomerEmail(data: EmailData) {
  const { email, name, formType } = data;

  let htmlContent = "";
  let subject = "";

  if (formType === "Client Onboarding") {
    subject = "Welcome to Better Systems AI - Onboarding Received";
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
  } else if (formType === "Contact Card Form") {
    subject = "Welcome to Better Systems AI!";
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285F4;">Welcome, ${name}! 👋</h2>
        <p>Thank you for submitting your contact information. We're excited to connect with you and learn more about ${data.company ? data.company : "your company"}.</p>
        <p>Our team will review your information and get back to you soon to discuss how Better Systems AI can help transform your business.</p>
        <p>In the meantime, feel free to reach out if you have any questions.</p>
        <p>Best regards,<br>Rodolfo Alvarez<br>CEO & Founder<br>Better Systems AI</p>
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
      from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
      to: email,
      subject: subject,
      html: htmlContent,
    });

    // Log email to database
    if (result.data?.id) {
      try {
        await db.insert(emailLogs).values({
          resendId: result.data.id,
          from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
          to: [email],
          subject: subject,
          htmlBody: htmlContent,
          status: "sent",
          lastEvent: "email.sent",
          category: "transactional",
          sentAt: new Date(),
          syncedAt: new Date(),
        });
      } catch (dbError) {
        console.error("[Email Service] Failed to log email to database:", dbError);
        // Don't fail the email send if logging fails
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending customer email:", error);
    return { success: false, error };
  }
}

export async function sendAdminNotification(data: EmailData) {
  const { formType } = data;

  let htmlContent = "";
  let subjectLine = "";

  if (formType === "Client Onboarding") {
    // Client Onboarding specific email template
    subjectLine = `New Client Onboarding: ${data.businessName || "Unknown Business"}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285F4;">New Client Onboarding Submission</h2>
        
        <h3>Business Information</h3>
        <p><strong>Business Name:</strong> ${data.businessName || "Not provided"}</p>
        <p><strong>Legal Business Name:</strong> ${data.legalBusinessName || "Not provided"}</p>
        <p><strong>Business Address:</strong> ${data.businessAddress || "Not provided"}</p>
        <p><strong>Business Phone:</strong> ${data.businessPhone || "Not provided"}</p>
        <p><strong>Website:</strong> ${data.website || "Not provided"}</p>
        
        <h3>Primary Contact</h3>
        <p><strong>Name:</strong> ${data.primaryContactName || "Not provided"}</p>
        <p><strong>Title:</strong> ${data.primaryContactTitle || "Not provided"}</p>
        <p><strong>Email:</strong> ${data.primaryContactEmail || "Not provided"}</p>
        <p><strong>Phone:</strong> ${data.primaryContactPhone || "Not provided"}</p>
        
        <h3>Operations Contact</h3>
        <p><strong>Name:</strong> ${data.operationsContactName || "Not provided"}</p>
        <p><strong>Title:</strong> ${data.operationsContactTitle || "Not provided"}</p>
        <p><strong>Email:</strong> ${data.operationsContactEmail || "Not provided"}</p>
        <p><strong>Phone:</strong> ${data.operationsContactPhone || "Not provided"}</p>
        
        <h3>Billing Contact</h3>
        <p><strong>Name:</strong> ${data.billingContactName || "Not provided"}</p>
        <p><strong>Title:</strong> ${data.billingContactTitle || "Not provided"}</p>
        <p><strong>Email:</strong> ${data.billingContactEmail || "Not provided"}</p>
        <p><strong>Phone:</strong> ${data.billingContactPhone || "Not provided"}</p>
        
        <h3>Additional Information</h3>
        <p><strong>Notes:</strong> ${data.additionalNotes || "None provided"}</p>
        
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Submitted at: ${data.submittedAt || new Date().toISOString()}</p>
      </div>
    `;
  } else if (formType === "Contact Card Form") {
    // Contact Card Form template
    const { name, email, phone, company, notes } = data;
    subjectLine = `New Contact Card Submission from ${name}${company ? ` - ${company}` : ""}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285F4;">New Contact Card Form Submission</h2>
        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        ${
          notes
            ? `
        <h3>Notes</h3>
        <p style="white-space: pre-wrap;">${notes}</p>
        `
            : ""
        }
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
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Message:</strong><br>${message || "No message"}</p>
      </div>
    `;
  }

  try {
    // Use developer email for testing if set, otherwise use EMAIL_TO
    const recipientEmail = process.env.DEVELOPER_EMAIL || process.env.EMAIL_TO || "contact@bettersystemsai.com";

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
      to: recipientEmail,
      subject: subjectLine,
      html: htmlContent,
    });

    // Log email to database
    if (result.data?.id) {
      try {
        await db.insert(emailLogs).values({
          resendId: result.data.id,
          from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
          to: [recipientEmail],
          subject: subjectLine,
          htmlBody: htmlContent,
          status: "sent",
          lastEvent: "email.sent",
          category: "notification",
          sentAt: new Date(),
          syncedAt: new Date(),
        });
      } catch (dbError) {
        console.error("[Email Service] Failed to log email to database:", dbError);
        // Don't fail the email send if logging fails
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return { success: false, error };
  }
}

// Project Update Email
interface ProjectUpdateEmailData {
  to: string;
  clientName: string;
  projectName: string;
  updateTitle: string;
  updateContent: string;
  updateType: string;
}

export async function sendProjectUpdateEmail(data: ProjectUpdateEmailData) {
  const { to, clientName, projectName, updateTitle, updateContent, updateType } = data;

  const typeColors: Record<string, string> = {
    progress: "#4285F4",
    milestone: "#34A853",
    blocker: "#EA4335",
    deliverable: "#FBBC04",
    general: "#5F6368",
  };

  const typeLabels: Record<string, string> = {
    progress: "Progress Update",
    milestone: "Milestone Reached",
    blocker: "Important Notice",
    deliverable: "Deliverable Ready",
    general: "Project Update",
  };

  const color = typeColors[updateType] || typeColors.general;
  const label = typeLabels[updateType] || typeLabels.general;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${label}: ${projectName}</h2>
      </div>

      <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${clientName},</p>

        <h3 style="color: ${color}; margin-top: 20px;">${updateTitle}</h3>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
          ${updateContent.replace(/\n/g, "<br>")}
        </div>

        <p>If you have any questions about this update, please don't hesitate to reach out.</p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">

        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The Better Systems AI Team
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
      to: to,
      subject: `[${projectName}] ${updateTitle}`,
      html: htmlContent,
    });

    // Log email to database
    if (result.data?.id) {
      try {
        await db.insert(emailLogs).values({
          resendId: result.data.id,
          from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
          to: [to],
          subject: `[${projectName}] ${updateTitle}`,
          htmlBody: htmlContent,
          status: "sent",
          lastEvent: "email.sent",
          category: "client",
          sentAt: new Date(),
          syncedAt: new Date(),
        });
      } catch (dbError) {
        console.error("[Email Service] Failed to log email to database:", dbError);
        // Don't fail the email send if logging fails
      }
    }

    console.log(`[Email] Project update sent to ${to} for project ${projectName}`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending project update email:", error);
    return { success: false, error };
  }
}
