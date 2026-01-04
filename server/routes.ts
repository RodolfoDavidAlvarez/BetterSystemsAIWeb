import "./loadEnv";
import type { Express } from "express";
import { login, register, getCurrentUser } from "./controllers/auth";
import { authenticate, isAdmin } from "./middleware/auth";
import { sendCustomerEmail, sendAdminNotification } from "./services/email";
import { saveToAirtable } from "./services/airtable";

// CRM Controllers
import { getAllClients, getClientById, createClient, updateClient, deleteClient, getClientStats } from "./controllers/clients";

import { getAllProjects, getProjectById, createProject, updateProject, deleteProject, getProjectStats } from "./controllers/projects";

import { getProjectUpdates, createProjectUpdate, sendUpdateToClient, updateProjectUpdate, deleteProjectUpdate } from "./controllers/projectUpdates";

import { getActivityLog, logActivity, getActivityStats } from "./controllers/activity";

import {
  syncAllStripeData,
  syncStripeCustomers,
  syncStripeInvoices,
  syncStripePaymentIntents,
  syncStripeSubscriptions,
  createInvoice,
  createPaymentLinkForClient,
  getBillingDashboard,
  getFreshStripeData,
  getClientBillingSummary,
  getDealBillingSummary,
} from "./controllers/billing";

import {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  addDealInteraction,
  getDealInteractions,
  getDealEmails,
} from "./controllers/deals";

import { getDocuments, uploadDocument, deleteDocument, updateDocument, upload } from "./controllers/documents";

import { sendDealUpdate, getEmailTemplates, previewEmail } from "./controllers/dealUpdates";

import {
  getAllClientTasks,
  getClientTasks,
  createClientTask,
  updateClientTask,
  deleteClientTask,
} from "./controllers/clientTasks";

import {
  getAllChangelogs,
  getChangelogById,
  createChangelog,
  updateChangelog,
  deleteChangelog,
  syncFromGitHub,
  getGitHubRepoInfo,
  getPublicChangelogs,
} from "./controllers/changelogs";

import { getAllUpdates, getUpdateById, sendUpdate, deleteUpdate } from "./controllers/systemUpdates";

import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getBillableTickets,
  markTicketsAsBilled,
  getTicketStats,
} from "./controllers/tickets";

import { receiveExternalTicket, getExternalTicketStatus, externalTicketsHealthCheck } from "./controllers/externalTickets";

import { getDealStakeholders, addDealStakeholder, updateDealStakeholder, removeDealStakeholder } from "./controllers/stakeholders";

import { getAllEmailLogs, getEmailLogById, getEmailStats, syncEmailsFromResend, handleResendWebhook, syncEmailsFromGmailController } from "./controllers/emailLogs";

import { constructWebhookEvent, handleWebhookEvent } from "./services/stripe";

export function registerRoutes(app: Express) {
  // Public API routes
  app.post("/api/contact", async (req, res) => {
    console.log("Contact API endpoint hit");
    try {
      console.log("Processing contact request:", req.body);

      // Extract form data
      const formData = {
        ...req.body,
        formType: req.body.formIdentifier || "Contact Form",
        submittedAt: new Date().toISOString(),
      };

      // Save to Airtable
      const airtableResult = await saveToAirtable(formData);
      if (!airtableResult.success) {
        console.error("Airtable save failed:", airtableResult.error);
      }

      // Send customer confirmation email
      const customerEmailResult = await sendCustomerEmail(formData);
      if (!customerEmailResult.success) {
        console.error("Customer email failed:", customerEmailResult.error);
      }

      // Send admin notification
      const adminEmailResult = await sendAdminNotification(formData);
      if (!adminEmailResult.success) {
        console.error("Admin email failed:", adminEmailResult.error);
      }

      res.json({
        success: true,
        message: "Your submission has been received. Check your email for confirmation.",
        recordId: airtableResult.recordId,
      });
    } catch (error) {
      console.error("Contact API error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process your submission. Please try again.",
      });
    }
  });

  // New Client Onboarding endpoint (sends notification to ralvarez@soilseedandwater.com for testing)
  app.post("/api/onboard", async (req, res) => {
    console.log("New onboarding API endpoint hit");
    try {
      console.log("Processing onboarding data:", req.body);

      const onboardingData = {
        ...req.body,
        formType: "New Client Onboarding",
        submittedAt: new Date().toISOString(),
      };

      // Save to Airtable
      const airtableResult = await saveToAirtable(onboardingData);
      if (!airtableResult.success) {
        console.error("Airtable save failed:", airtableResult.error);
      }

      // Send customer confirmation email if primary contact email provided
      if (onboardingData.primaryContactEmail) {
        const customerEmailResult = await sendCustomerEmail({
          ...onboardingData,
          email: onboardingData.primaryContactEmail,
          name: onboardingData.primaryContactName || onboardingData.businessName,
          formIdentifier: "New Client Onboarding",
        });
        if (!customerEmailResult.success) {
          console.error("Customer email failed:", customerEmailResult.error);
        }
      }

      // Send admin notification to ralvarez@soilseedandwater.com for testing
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const adminEmailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">New Client Onboarding</h1>
            <p style="color: #94a3b8; margin-top: 8px;">A new client has completed the onboarding form</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Business Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0;">Company:</td><td style="color: #fff; padding: 8px 0;"><strong>${onboardingData.businessName || "Not provided"}</strong></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Legal Name:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.legalBusinessName || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Industry:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.industry || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Company Size:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.companySize || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Website:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.website || "Not provided"}</td></tr>
            </table>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Primary Contact</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0;">Name:</td><td style="color: #fff; padding: 8px 0;"><strong>${onboardingData.primaryContactName || "Not provided"}</strong></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Title:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.primaryContactTitle || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Email:</td><td style="color: #fff; padding: 8px 0;"><a href="mailto:${onboardingData.primaryContactEmail}" style="color: #60a5fa;">${onboardingData.primaryContactEmail || "Not provided"}</a></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Phone:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.primaryContactPhone || "Not provided"}</td></tr>
            </table>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Team Contacts</h2>
            <div style="margin-bottom: 16px;">
              <h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Operations</h3>
              <p style="margin: 4px 0; color: #fff;">${onboardingData.operationsContactName || "Not provided"} ${onboardingData.operationsContactTitle ? `(${onboardingData.operationsContactTitle})` : ""}</p>
              <p style="margin: 4px 0; color: #94a3b8;">${onboardingData.operationsContactEmail || ""} ${onboardingData.operationsContactPhone ? `| ${onboardingData.operationsContactPhone}` : ""}</p>
            </div>
            <div>
              <h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Billing</h3>
              <p style="margin: 4px 0; color: #fff;">${onboardingData.billingContactName || "Not provided"} ${onboardingData.billingContactTitle ? `(${onboardingData.billingContactTitle})` : ""}</p>
              <p style="margin: 4px 0; color: #94a3b8;">${onboardingData.billingContactEmail || ""} ${onboardingData.billingContactPhone ? `| ${onboardingData.billingContactPhone}` : ""}</p>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Project Scope</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0;">Budget:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.budgetRange || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Timeline:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.timeline || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Referral Source:</td><td style="color: #fff; padding: 8px 0;">${onboardingData.referralSource || "Not provided"}</td></tr>
            </table>
            ${onboardingData.painPoints ? `<div style="margin-top: 16px;"><h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Pain Points</h3><p style="color: #fff; margin: 0; white-space: pre-wrap;">${onboardingData.painPoints}</p></div>` : ""}
            ${onboardingData.currentTools ? `<div style="margin-top: 16px;"><h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Current Tools</h3><p style="color: #fff; margin: 0;">${onboardingData.currentTools}</p></div>` : ""}
            ${onboardingData.additionalNotes ? `<div style="margin-top: 16px;"><h3 style="color: #a5b4fc; margin: 0 0 8px 0; font-size: 14px;">Additional Notes</h3><p style="color: #fff; margin: 0; white-space: pre-wrap;">${onboardingData.additionalNotes}</p></div>` : ""}
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            Submitted at: ${onboardingData.submittedAt}
          </p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
          to: "ralvarez@soilseedandwater.com",
          subject: `🚀 New Client Onboarding: ${onboardingData.businessName || "Unknown Business"}`,
          html: adminEmailHtml,
        });
        console.log("Admin notification sent to ralvarez@soilseedandwater.com");
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      res.json({
        success: true,
        message: "Onboarding information received successfully.",
        recordId: airtableResult.recordId,
      });
    } catch (error) {
      console.error("Onboarding API error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process onboarding information. Please try again.",
      });
    }
  });

  // Discovery Call Booking endpoint
  app.post("/api/book", async (req, res) => {
    console.log("Booking API endpoint hit");
    try {
      console.log("Processing booking:", req.body);

      const { date, time, name, email, company, interest, notes } = req.body;

      if (!date || !time || !name || !email) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: date, time, name, email",
        });
      }

      const bookingData = {
        date,
        time,
        name,
        email,
        company: company || "Not provided",
        interest: interest || "Not specified",
        notes: notes || "No notes",
        formType: "Discovery Call Booking",
        submittedAt: new Date().toISOString(),
      };

      // Save to Airtable
      const airtableResult = await saveToAirtable(bookingData);
      if (!airtableResult.success) {
        console.error("Airtable save failed:", airtableResult.error);
      }

      // Format date for display
      const bookingDate = new Date(date);
      const formattedDate = bookingDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Convert time to display format
      const [hour, minute] = time.split(":");
      const hourNum = parseInt(hour);
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum;
      const ampm = hourNum >= 12 ? "PM" : "AM";
      const displayTime = `${displayHour}:${minute} ${ampm}`;

      // Send confirmation email to customer
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const customerEmailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Your Call is Booked!</h1>
            <p style="color: #94a3b8; margin-top: 8px;">Discovery Call with Better Systems AI</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: center;">
            <p style="color: #60a5fa; font-size: 14px; margin: 0 0 8px 0;">SCHEDULED FOR</p>
            <p style="color: #fff; font-size: 24px; font-weight: bold; margin: 0;">${formattedDate}</p>
            <p style="color: #fff; font-size: 20px; margin: 8px 0 0 0;">${displayTime} (Arizona Time)</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">What to Expect</h2>
            <ul style="color: #fff; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>15-minute discovery call</li>
              <li>We'll discuss your business automation needs</li>
              <li>No sales pressure - just exploring if we're a good fit</li>
              <li>You'll receive a follow-up with recommendations</li>
            </ul>
          </div>

          <div style="background: rgba(96, 165, 250, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid rgba(96, 165, 250, 0.3);">
            <p style="color: #60a5fa; margin: 0; font-size: 14px;">
              <strong>Note:</strong> You'll receive a calendar invite with the meeting link shortly before your call.
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            Better Systems AI | bettersystems.ai
          </p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
          to: email,
          subject: `Discovery Call Confirmed - ${formattedDate} at ${displayTime}`,
          html: customerEmailHtml,
        });
        console.log("Customer confirmation email sent to:", email);
      } catch (emailError) {
        console.error("Failed to send customer confirmation:", emailError);
      }

      // Send notification to admin (developer@bettersystems.ai)
      const adminEmailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">New Discovery Call Booked!</h1>
            <p style="color: #94a3b8; margin-top: 8px;">itsRodo Alvarez Personal Brand Lead</p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid rgba(34, 197, 94, 0.3); text-align: center;">
            <p style="color: #22c55e; font-size: 24px; font-weight: bold; margin: 0;">${formattedDate}</p>
            <p style="color: #22c55e; font-size: 20px; margin: 8px 0 0 0;">${displayTime}</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0; width: 120px;">Name:</td><td style="color: #fff; padding: 8px 0;"><strong>${name}</strong></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Email:</td><td style="color: #fff; padding: 8px 0;"><a href="mailto:${email}" style="color: #60a5fa;">${email}</a></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Company:</td><td style="color: #fff; padding: 8px 0;">${company || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Interest:</td><td style="color: #fff; padding: 8px 0;">${interest || "Not specified"}</td></tr>
            </table>
          </div>

          ${notes ? `
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Notes from Prospect</h2>
            <p style="color: #fff; margin: 0; white-space: pre-wrap;">${notes}</p>
          </div>
          ` : ""}

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">
              Remember to send a calendar invite with meeting link!
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            Submitted at: ${bookingData.submittedAt}
          </p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
          to: "developer@bettersystems.ai",
          subject: `[BOOKING] ${name} - ${formattedDate} at ${displayTime}`,
          html: adminEmailHtml,
        });
        console.log("Admin notification sent to developer@bettersystems.ai");
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      res.json({
        success: true,
        message: "Your discovery call has been booked successfully.",
        recordId: airtableResult.recordId,
      });
    } catch (error) {
      console.error("Booking API error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process your booking. Please try again.",
      });
    }
  });

  // Client Onboarding endpoint
  app.post("/api/client-onboarding", async (req, res) => {
    console.log("Client onboarding API endpoint hit");
    try {
      console.log("Processing onboarding data:", req.body);

      // Extract form data
      const onboardingData = {
        ...req.body,
        formType: "Client Onboarding",
        submittedAt: new Date().toISOString(),
      };

      // Save to Airtable
      const airtableResult = await saveToAirtable(onboardingData);
      if (!airtableResult.success) {
        console.error("Airtable save failed:", airtableResult.error);
      }

      // Send customer confirmation email
      const customerEmailResult = await sendCustomerEmail({
        ...onboardingData,
        email: onboardingData.primaryContactEmail,
        name: onboardingData.primaryContactName,
        formIdentifier: "Client Onboarding",
      });
      if (!customerEmailResult.success) {
        console.error("Customer email failed:", customerEmailResult.error);
      }

      // Send admin notification
      const adminEmailResult = await sendAdminNotification({
        ...onboardingData,
        formIdentifier: "Client Onboarding",
      });
      if (!adminEmailResult.success) {
        console.error("Admin email failed:", adminEmailResult.error);
      }

      res.json({
        success: true,
        message: "Onboarding information received successfully.",
        recordId: airtableResult.recordId,
      });
    } catch (error) {
      console.error("Client onboarding API error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process onboarding information. Please try again.",
      });
    }
  });

  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    console.log("[Route] Login route handler called");
    login(req, res).catch(next);
  });
  app.post("/api/auth/register", register);
  app.get("/api/auth/me", authenticate, getCurrentUser);

  // Emergency test endpoint for debugging auth issues
  app.get("/api/auth/test", (req, res) => {
    console.log("Auth test endpoint accessed");
    res.json({
      success: true,
      message: "Auth API is accessible",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // ==================== CRM API ROUTES ====================

  // Client routes (protected)
  app.get("/api/admin/clients", authenticate, isAdmin, getAllClients);
  app.get("/api/admin/clients/stats", authenticate, isAdmin, getClientStats);
  app.get("/api/admin/clients/:id", authenticate, isAdmin, getClientById);
  app.post("/api/admin/clients", authenticate, isAdmin, createClient);
  app.put("/api/admin/clients/:id", authenticate, isAdmin, updateClient);
  app.delete("/api/admin/clients/:id", authenticate, isAdmin, deleteClient);

  // Project routes (protected)
  app.get("/api/admin/projects", authenticate, isAdmin, getAllProjects);
  app.get("/api/admin/projects/stats", authenticate, isAdmin, getProjectStats);
  app.get("/api/admin/projects/:id", authenticate, isAdmin, getProjectById);
  app.post("/api/admin/projects", authenticate, isAdmin, createProject);
  app.put("/api/admin/projects/:id", authenticate, isAdmin, updateProject);
  app.delete("/api/admin/projects/:id", authenticate, isAdmin, deleteProject);

  // Project Updates routes (protected)
  app.get("/api/admin/projects/:projectId/updates", authenticate, isAdmin, getProjectUpdates);
  app.post("/api/admin/projects/:projectId/updates", authenticate, isAdmin, createProjectUpdate);
  app.put("/api/admin/updates/:updateId", authenticate, isAdmin, updateProjectUpdate);
  app.delete("/api/admin/updates/:updateId", authenticate, isAdmin, deleteProjectUpdate);
  app.post("/api/admin/updates/:updateId/send", authenticate, isAdmin, sendUpdateToClient);

  // Activity Log routes (protected)
  app.get("/api/admin/activity", authenticate, isAdmin, getActivityLog);
  app.post("/api/admin/activity", authenticate, isAdmin, logActivity);
  app.get("/api/admin/activity/stats", authenticate, isAdmin, getActivityStats);

  // Dashboard stats
  app.get("/api/admin/dashboard/stats", authenticate, isAdmin, async (req, res) => {
    try {
      // Return combined stats for the dashboard
      res.json({
        success: true,
        message: "Dashboard stats endpoint - use individual stat endpoints for data",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
    }
  });

  // ==================== CLIENT TASKS ROUTES ====================

  // Client Tasks (To-Do items)
  app.get("/api/admin/client-tasks", authenticate, isAdmin, getAllClientTasks);
  app.get("/api/admin/client-tasks/:clientName", authenticate, isAdmin, getClientTasks);
  app.post("/api/admin/client-tasks", authenticate, isAdmin, createClientTask);
  app.put("/api/admin/client-tasks/:id", authenticate, isAdmin, updateClientTask);
  app.delete("/api/admin/client-tasks/:id", authenticate, isAdmin, deleteClientTask);

  // ==================== BILLING & STRIPE ROUTES ====================

  // Billing Dashboard
  app.get("/api/admin/billing/dashboard", authenticate, isAdmin, getBillingDashboard);
  app.get("/api/admin/billing/fresh", authenticate, isAdmin, getFreshStripeData);
  app.get("/api/admin/billing/client/:clientId", authenticate, isAdmin, getClientBillingSummary);
  app.get("/api/admin/billing/deal/:dealId", authenticate, isAdmin, getDealBillingSummary);

  // Stripe Sync Operations
  app.post("/api/admin/billing/sync/all", authenticate, isAdmin, syncAllStripeData);
  app.post("/api/admin/billing/sync/customers", authenticate, isAdmin, syncStripeCustomers);
  app.post("/api/admin/billing/sync/invoices", authenticate, isAdmin, syncStripeInvoices);
  app.post("/api/admin/billing/sync/payments", authenticate, isAdmin, syncStripePaymentIntents);
  app.post("/api/admin/billing/sync/subscriptions", authenticate, isAdmin, syncStripeSubscriptions);

  // Invoice Management
  app.post("/api/admin/billing/invoices", authenticate, isAdmin, createInvoice);

  // Payment Links
  app.post("/api/admin/billing/payment-links", authenticate, isAdmin, createPaymentLinkForClient);

  // ==================== DEALS ROUTES ====================

  // Deal routes (protected)
  app.get("/api/admin/deals", authenticate, isAdmin, getAllDeals);
  app.get("/api/admin/deals/:id", authenticate, isAdmin, getDealById);
  app.post("/api/admin/deals", authenticate, isAdmin, createDeal);
  app.put("/api/admin/deals/:id", authenticate, isAdmin, updateDeal);
  app.delete("/api/admin/deals/:id", authenticate, isAdmin, deleteDeal);

  // Deal interactions
  app.get("/api/admin/deals/:id/interactions", authenticate, isAdmin, getDealInteractions);
  app.post("/api/admin/deals/:id/interactions", authenticate, isAdmin, addDealInteraction);

  // Deal emails (Resend logs for stakeholders)
  app.get("/api/admin/deals/:dealId/emails", authenticate, isAdmin, getDealEmails);

  // Deal updates (email)
  app.post("/api/admin/deals/:id/send-update", authenticate, isAdmin, sendDealUpdate);
  app.post("/api/admin/deals/preview-email", authenticate, isAdmin, previewEmail);
  app.get("/api/admin/email-templates", authenticate, isAdmin, getEmailTemplates);

  // Deal stakeholders (contacts associated with deals)
  app.get("/api/admin/deals/:dealId/stakeholders", authenticate, isAdmin, getDealStakeholders);
  app.post("/api/admin/deals/:dealId/stakeholders", authenticate, isAdmin, addDealStakeholder);
  app.put("/api/admin/stakeholders/:stakeholderId", authenticate, isAdmin, updateDealStakeholder);
  app.delete("/api/admin/stakeholders/:stakeholderId", authenticate, isAdmin, removeDealStakeholder);

  // ==================== DOCUMENTS ROUTES ====================

  // Document routes (protected)
  app.get("/api/admin/documents/:entityType/:entityId", authenticate, isAdmin, getDocuments);
  app.post("/api/admin/documents/upload", authenticate, isAdmin, upload.single("file"), uploadDocument);
  app.put("/api/admin/documents/:id", authenticate, isAdmin, updateDocument);
  app.delete("/api/admin/documents/:id", authenticate, isAdmin, deleteDocument);

  // ==================== CHANGELOG ROUTES ====================

  // Changelog routes (protected)
  app.get("/api/admin/changelogs", authenticate, isAdmin, getAllChangelogs);
  app.get("/api/admin/changelogs/public", authenticate, isAdmin, getPublicChangelogs);
  app.get("/api/admin/changelogs/:id", authenticate, isAdmin, getChangelogById);
  app.post("/api/admin/changelogs", authenticate, isAdmin, createChangelog);
  app.put("/api/admin/changelogs/:id", authenticate, isAdmin, updateChangelog);
  app.delete("/api/admin/changelogs/:id", authenticate, isAdmin, deleteChangelog);

  // GitHub sync routes
  app.post("/api/admin/changelogs/sync/github", authenticate, isAdmin, syncFromGitHub);
  app.get("/api/admin/changelogs/github/repo", authenticate, isAdmin, getGitHubRepoInfo);

  // ==================== SYSTEM UPDATES ROUTES ====================

  // System Updates routes (protected) - for sending announcements to deal administrators
  app.get("/api/admin/updates", authenticate, isAdmin, getAllUpdates);
  app.get("/api/admin/updates/:id", authenticate, isAdmin, getUpdateById);
  app.post("/api/admin/updates/send", authenticate, isAdmin, sendUpdate);
  app.delete("/api/admin/updates/:id", authenticate, isAdmin, deleteUpdate);

  // ==================== SUPPORT TICKETS ROUTES ====================

  // Admin ticket routes (protected)
  app.get("/api/admin/tickets", authenticate, isAdmin, getAllTickets);
  app.get("/api/admin/tickets/stats", authenticate, isAdmin, getTicketStats);
  app.get("/api/admin/tickets/billable", authenticate, isAdmin, getBillableTickets);
  app.get("/api/admin/tickets/:id", authenticate, isAdmin, getTicketById);
  app.post("/api/admin/tickets", authenticate, isAdmin, createTicket);
  app.put("/api/admin/tickets/:id", authenticate, isAdmin, updateTicket);
  app.delete("/api/admin/tickets/:id", authenticate, isAdmin, deleteTicket);
  app.post("/api/admin/tickets/mark-billed", authenticate, isAdmin, markTicketsAsBilled);

  // ==================== EXTERNAL TICKETS API (PUBLIC) ====================

  // External ticket submission endpoint (API key authenticated, not session auth)
  app.post("/api/external/tickets", receiveExternalTicket);
  app.get("/api/external/tickets/health", externalTicketsHealthCheck);
  app.get("/api/external/tickets/:externalId/status", getExternalTicketStatus);

  // Serve uploaded files
  app.use("/uploads", authenticate, isAdmin, (req, res, next) => {
    const express = require("express");
    express.static("uploads")(req, res, next);
  });

  // ==================== EMAIL LOGS ROUTES ====================

  // Email logs routes (protected)
  app.get("/api/admin/emails", authenticate, isAdmin, getAllEmailLogs);
  app.get("/api/admin/emails/stats", authenticate, isAdmin, getEmailStats);
  app.get("/api/admin/emails/:id", authenticate, isAdmin, getEmailLogById);
  app.post("/api/admin/emails/sync", authenticate, isAdmin, syncEmailsFromResend);
  app.post("/api/admin/emails/sync/gmail", authenticate, isAdmin, syncEmailsFromGmailController);

  // Resend Webhook (no auth required - webhook signature verification should be added)
  app.post("/api/webhooks/resend", handleResendWebhook);

  // Stripe Webhook (no auth required - Stripe signature verification instead)
  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    try {
      // Construct the event using the raw body
      const event = constructWebhookEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

      // Handle the event
      const result = await handleWebhookEvent(event);

      console.log(`[Stripe Webhook] Processed ${event.type}:`, result);

      res.json({ received: true, type: result.type });
    } catch (error: any) {
      console.error("[Stripe Webhook] Error:", error.message);
      return res.status(400).json({ error: error.message });
    }
  });
}
