import "./loadEnv";
import type { Express } from "express";
import express from "express";
import { existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { login, register, getCurrentUser } from "./controllers/auth";
import { authenticate, isAdmin, hasRole } from "./middleware/auth";
import { sendCustomerEmail, sendAdminNotification } from "./services/email";
import { saveToAirtable } from "./services/airtable";
import { analyzeVoiceAgentLead, formatLeadEmailHtml } from "./services/leadAnalysis";
import { Resend } from "resend";
import { db } from "../db/index";
import { bookings, presentationLeads } from "../db/schema";
import { sql } from "drizzle-orm";

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
  getMonthlyRevenue,
  getPaymentHistory,
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

import {
  getAllCampaigns,
  getCampaignStats,
  getCampaignById,
  addClientToCampaign,
  updateCampaign,
  removeCampaign,
  bulkAddToCampaign,
} from "./controllers/campaigns";

import {
  getColdOutreachLeads,
  getColdOutreachMetrics,
  updateLeadStatus,
  toggleAutomation,
  bulkUpdateLeads,
  getDailyReport,
} from "./controllers/coldOutreach";
import { submitReview, getAllReviews, getReviewStats, updateReview, deleteReview } from "./controllers/reviews";

import {
  handlePlaudWebhook,
  getAllRecordings,
  getRecordingById,
  updateRecording,
  retranscribeRecording,
  deleteRecording,
} from "./controllers/recordings";

import { constructWebhookEvent, handleWebhookEvent } from "./services/stripe";
import { getOpenClawConfigSnapshot, getOpenClawStatusSnapshot } from "./services/openclaw";
import { createOperatorRealtimeSession, finalizeOperatorSession, getOperatorSession } from "./services/operatorRealtime";
import { createOperatorActionEvent, executeOperatorTool } from "./services/operatorTools";
import type { OperatorActionEvent, OperatorTranscriptLine } from "./services/operatorTypes";
import { generateOperatorReply } from "./services/operatorResponder";
import { handleVoiceTurn } from "./services/operatorVoiceChat";
import multer from "multer";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Supabase Storage client (used for dev-tracker attachments)
const supabaseStorage = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;
const ATTACHMENTS_BUCKET = "dev-tracker-attachments";
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
const voiceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function registerRoutes(app: Express) {

  // ==================== INVOICE PAYMENT PAGES ====================

  // Payment page config — server-side date check determines which Stripe link to show
  const INVOICE_PAYMENTS: Record<string, {
    invoiceNumber: string;
    clientName: string;
    projectName: string;
    issuedDate: string;
    dueDate: string;
    subtotal: number;
    fullTotal: number;
    discountPercent: number;
    discountDeadline: string; // ISO date — after this, full price kicks in
    discountPaymentUrl: string;
    fullPaymentUrl: string;
    lineItems: { description: string; detail: string; amount: number }[];
  }> = {
    "BSA-2026-004": {
      invoiceNumber: "BSA-2026-004",
      clientName: "Brian Mitchell",
      projectName: "Bubba's New Home Guide — Interactive Property Map",
      issuedDate: "February 8, 2026",
      dueDate: "March 31, 2026",
      subtotal: 2393.50,
      fullTotal: 2393.50,
      discountPercent: 0,
      discountDeadline: "2026-02-15T23:59:59-07:00", // expired
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
      discountDeadline: "2026-02-24T23:59:59-07:00", // Feb 24, 2026 end of day AZ time
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

  app.get("/api/pay/:invoiceNumber", async (req, res) => {
    const config = INVOICE_PAYMENTS[req.params.invoiceNumber];
    if (!config) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const now = new Date();
    const deadline = new Date(config.discountDeadline);
    const isDiscounted = now <= deadline;

    const savings = Math.round(config.fullTotal * (config.discountPercent / 100) * 100) / 100;
    const discountedTotal = Math.round((config.fullTotal - savings) * 100) / 100;

    // Format the discount deadline for display
    const deadlineDisplay = new Date(config.discountDeadline).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Phoenix",
    });

    // Check if invoice is paid (from database)
    let isPaid = false;
    try {
      const result = await db.execute(
        sql`SELECT status, amount_paid FROM invoices WHERE invoice_number = ${config.invoiceNumber} LIMIT 1`
      );
      const row = (result as any).rows?.[0];
      if (row && (row.status === "paid" || Number(row.amount_paid) > 0)) {
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

  // Public API routes
  app.post("/api/reviews", submitReview);

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

      // Save to PostgreSQL database
      let bookingRecord;
      try {
        const [newBooking] = await db.insert(bookings).values({
          date,
          time,
          name,
          email,
          company: company || null,
          interest: interest || null,
          notes: notes || null,
          status: "pending",
          confirmationSent: true,
        }).returning();
        bookingRecord = newBooking;
        console.log("Booking saved to database:", bookingRecord.id);
      } catch (dbError) {
        console.error("Database save failed:", dbError);
      }

      // Also save to Airtable as backup
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
          from: "Better Systems AI <info@bettersystems.ai>",
          to: email,
          subject: `Discovery Call Confirmed - ${formattedDate} at ${displayTime}`,
          html: customerEmailHtml,
        });
        console.log("Customer confirmation email sent to:", email);
      } catch (emailError) {
        console.error("Failed to send customer confirmation:", emailError);
      }

      // Send notification to admin
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
          from: "Better Systems AI <info@bettersystems.ai>",
          to: "rodolfo@bettersystems.ai",
          subject: `[BOOKING] ${name} - ${formattedDate} at ${displayTime}`,
          html: adminEmailHtml,
        });
        console.log("Admin notification sent to rodolfo@bettersystems.ai");
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      res.json({
        success: true,
        message: "Your discovery call has been booked successfully.",
        bookingId: bookingRecord?.id,
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

  // Get booked slots for a specific date (for availability checking)
  app.get("/api/bookings/slots/:date", async (req, res) => {
    try {
      const { date } = req.params;

      // Get all bookings for this date that aren't cancelled
      const bookedSlots = await db
        .select({ time: bookings.time })
        .from(bookings)
        .where(
          sql`${bookings.date} = ${date} AND ${bookings.status} != 'cancelled'`
        );

      res.json({
        success: true,
        date,
        bookedTimes: bookedSlots.map(s => s.time),
      });
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch availability.",
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

  // ==================== OUTREACH LEADS API ROUTES ====================

  // PATCH lead — update status, notes, outreach_step
  app.patch("/api/admin/leads/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, outreach_step } = req.body;

      if (status === undefined && notes === undefined && outreach_step === undefined) {
        return res.status(400).json({ success: false, message: "No fields to update" });
      }

      const result = await db.execute(
        sql`UPDATE leads SET
          status = COALESCE(${status ?? null}, status),
          notes = COALESCE(${notes ?? null}, notes),
          outreach_step = COALESCE(${outreach_step !== undefined ? outreach_step : null}, outreach_step),
          updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING *`
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Lead not found" });
      }

      res.json({ success: true, lead: result.rows[0] });
    } catch (error: any) {
      console.error("[Leads PATCH] Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET lead activity — today's sends + queued next
  app.get("/api/admin/leads/activity", authenticate, isAdmin, async (req, res) => {
    try {
      const campaign = req.query.campaign as string | undefined;

      const sentToday = campaign
        ? await db.execute(sql`
            SELECT id, first_name, last_name, email, company, state, outreach_step, last_email_sent, campaign
            FROM leads WHERE last_email_sent::date = CURRENT_DATE AND campaign = ${campaign}
            ORDER BY last_email_sent DESC`)
        : await db.execute(sql`
            SELECT id, first_name, last_name, email, company, state, outreach_step, last_email_sent, campaign
            FROM leads WHERE last_email_sent::date = CURRENT_DATE
            ORDER BY last_email_sent DESC`);

      const queuedNext = campaign
        ? await db.execute(sql`
            SELECT id, first_name, last_name, email, company, state, outreach_step, campaign
            FROM leads WHERE status = 'new' AND outreach_step = 0 AND campaign = ${campaign}
            ORDER BY CASE WHEN state = 'AZ' THEN 0 ELSE 1 END, employee_count ASC NULLS LAST, created_at ASC
            LIMIT 10`)
        : await db.execute(sql`
            SELECT id, first_name, last_name, email, company, state, outreach_step, campaign
            FROM leads WHERE status = 'new' AND outreach_step = 0
            ORDER BY CASE WHEN state = 'AZ' THEN 0 ELSE 1 END, employee_count ASC NULLS LAST, created_at ASC
            LIMIT 10`);

      res.json({ success: true, sent_today: sentToday.rows, queued_next: queuedNext.rows });
    } catch (error: any) {
      console.error("[Leads Activity] Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
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

  // ==================== REVIEWS ROUTES ====================

  app.get("/api/admin/reviews", authenticate, isAdmin, getAllReviews);
  app.get("/api/admin/reviews/stats", authenticate, isAdmin, getReviewStats);
  app.put("/api/admin/reviews/:id", authenticate, isAdmin, updateReview);
  app.delete("/api/admin/reviews/:id", authenticate, isAdmin, deleteReview);

  // ==================== BILLING & STRIPE ROUTES ====================

  // Billing Dashboard
  app.get("/api/admin/billing/dashboard", authenticate, isAdmin, getBillingDashboard);
  app.get("/api/admin/billing/monthly-revenue", authenticate, isAdmin, getMonthlyRevenue);
  app.get("/api/admin/billing/payments", authenticate, isAdmin, getPaymentHistory);
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
    express.static("uploads")(req, res, next);
  });

  // Serve Plaud audio recordings — proxy from VPS if local file missing
  app.use("/data/plaud-audio", authenticate, isAdmin, (req, res, next) => {
    const localPath = path.join("data/plaud-audio", req.path);
    if (!existsSync(localPath)) {
      try {
        mkdirSync("data/plaud-audio", { recursive: true });
        execSync(
          `scp -o ConnectTimeout=5 root@143.198.74.96:/opt/context-engine/data/plaud-audio/${path.basename(req.path)} ${localPath}`,
          { timeout: 15000 }
        );
        console.log(`[Audio] Fetched from VPS: ${path.basename(req.path)}`);
      } catch (e: any) {
        console.error("[Audio] Failed to fetch from VPS:", e.message);
      }
    }
    express.static("data/plaud-audio")(req, res, next);
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

  // ==================== EMAIL CAMPAIGNS ROUTES ====================

  // Email Campaigns/Sequences routes (protected)
  app.get("/api/admin/campaigns", authenticate, isAdmin, getAllCampaigns);
  app.get("/api/admin/campaigns/stats", authenticate, isAdmin, getCampaignStats);
  app.get("/api/admin/campaigns/:id", authenticate, isAdmin, getCampaignById);
  app.post("/api/admin/campaigns", authenticate, isAdmin, addClientToCampaign);
  app.post("/api/admin/campaigns/bulk", authenticate, isAdmin, bulkAddToCampaign);
  app.put("/api/admin/campaigns/:id", authenticate, isAdmin, updateCampaign);
  app.delete("/api/admin/campaigns/:id", authenticate, isAdmin, removeCampaign);

  // ==================== COLD OUTREACH ROUTES ====================

  // Cold Outreach leads and metrics (protected)
  app.get("/api/admin/cold-outreach/leads", authenticate, isAdmin, getColdOutreachLeads);
  app.get("/api/admin/cold-outreach/metrics", authenticate, isAdmin, getColdOutreachMetrics);
  app.get("/api/admin/cold-outreach/report", authenticate, isAdmin, getDailyReport);
  app.put("/api/admin/cold-outreach/leads/:id", authenticate, isAdmin, updateLeadStatus);
  app.post("/api/admin/cold-outreach/leads/:id/toggle-automation", authenticate, isAdmin, toggleAutomation);
  app.post("/api/admin/cold-outreach/bulk-update", authenticate, isAdmin, bulkUpdateLeads);

  // ==================== NEW LEADS PIPELINE (outreach-engine leads table) ====================
  app.get("/api/admin/cold-outreach/new-leads", authenticate, isAdmin, async (req, res) => {
    try {
      const campaign = req.query.campaign as string | undefined;
      const result = campaign
        ? await db.execute(sql`
            SELECT id, first_name, last_name, email, phone, title, company, company_website,
                   industry, city, state, employee_count, source, status, outreach_step,
                   last_email_sent, notes, campaign, resend_message_id, tags, created_at, updated_at
            FROM leads WHERE campaign = ${campaign}
            ORDER BY
              CASE WHEN status = 'replied' THEN 1 WHEN status = 'contacted' AND outreach_step < 3 THEN 2
                   WHEN status = 'new' THEN 3 WHEN status = 'bounced' THEN 4 ELSE 5 END,
              last_email_sent DESC NULLS LAST, created_at DESC
          `)
        : await db.execute(sql`
            SELECT id, first_name, last_name, email, phone, title, company, company_website,
                   industry, city, state, employee_count, source, status, outreach_step,
                   last_email_sent, notes, campaign, resend_message_id, tags, created_at, updated_at
            FROM leads
            ORDER BY
              CASE WHEN status = 'replied' THEN 1 WHEN status = 'contacted' AND outreach_step < 3 THEN 2
                   WHEN status = 'new' THEN 3 WHEN status = 'bounced' THEN 4 ELSE 5 END,
              last_email_sent DESC NULLS LAST, created_at DESC
          `);
      res.json({ success: true, leads: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/admin/cold-outreach/new-leads/metrics", authenticate, isAdmin, async (_req, res) => {
    try {
      const campaignMetrics = await db.execute(sql`
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
      `);
      const rows = campaignMetrics.rows as any[];
      const combined: any = {
        total: 0, new_leads: 0, contacted: 0, replied: 0, bounced: 0,
        not_emailed: 0, step_1: 0, step_2: 0, step_3_complete: 0, sent_today: 0
      };
      for (const m of rows) {
        for (const key of Object.keys(combined)) {
          combined[key] += Number(m[key]) || 0;
        }
      }
      res.json({ success: true, metrics: combined, by_campaign: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==================== CONTRACTOR INQUIRY ====================
  app.post("/api/contractor-inquiry", async (req, res) => {
    try {
      const { name, email, company, phone, message } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: "Name and email required" });
      }

      await db.execute(sql`
        INSERT INTO leads (first_name, last_name, email, phone, company, source, status, tags)
        VALUES (
          ${name.split(" ")[0] || name},
          ${name.split(" ").slice(1).join(" ") || null},
          ${email},
          ${phone || null},
          ${company || null},
          'website',
          'new',
          ARRAY['contractor_page']
        )
        ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      `);

      res.json({ success: true, message: "Inquiry received" });
    } catch (error: any) {
      console.error("[Contractor Inquiry] Error:", error.message);
      res.status(500).json({ success: false, message: "Failed to process inquiry" });
    }
  });

  // ==================== RESEND WEBHOOK ====================
  app.post("/api/webhooks/resend", async (req, res) => {
    try {
      const { type, data } = req.body;
      const recipient = data?.to?.[0] || data?.email || null;
      console.log(`[Resend Webhook] ${type} for ${recipient}`);

      if (!recipient) return res.json({ success: true, skipped: true });

      if (type === "email.bounced" || type === "email.complained") {
        await db.execute(sql`
          UPDATE leads SET status = 'bounced', updated_at = NOW()
          WHERE email = ${recipient} AND status != 'bounced'
        `);
      }

      res.json({ success: true, type, recipient });
    } catch (error: any) {
      console.error("[Resend Webhook] Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==================== OPENCLAW MISSION CONTROL ====================
  app.get("/api/admin/openclaw/config", authenticate, isAdmin, (_req, res) => {
    const config = getOpenClawConfigSnapshot();
    res.json({ success: true, config });
  });

  app.get("/api/admin/openclaw/status", authenticate, isAdmin, async (_req, res) => {
    try {
      const status = await getOpenClawStatusSnapshot();
      res.json({ success: true, status });
    } catch (error: any) {
      console.error("[OpenClaw] Status check failed:", error?.message || error);
      res.status(500).json({
        success: false,
        message: "Failed to read OpenClaw status",
        error: process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  });

  // ==================== OPERATOR VOICE (OPENCLAW + REALTIME) ====================
  app.post("/api/admin/operator/realtime/session", authenticate, isAdmin, async (_req, res) => {
    try {
      if (process.env.OPERATOR_VOICE_ENABLED === "false") {
        return res.status(403).json({ success: false, message: "Operator voice disabled by OPERATOR_VOICE_ENABLED=false" });
      }
      const session = await createOperatorRealtimeSession();
      res.json({ success: true, session });
    } catch (error: any) {
      console.error("[Operator] Failed to create realtime session:", error?.message || error);
      res.status(500).json({ success: false, message: error?.message || "Failed to create realtime session" });
    }
  });

  app.post("/api/admin/operator/tools/execute", authenticate, isAdmin, async (req, res) => {
    try {
      const sessionId = String(req.body?.sessionId || "");
      const utteranceId = String(req.body?.utteranceId || "");
      const toolName = String(req.body?.toolName || "");
      const args = (req.body?.arguments || {}) as Record<string, unknown>;

      if (!sessionId || !utteranceId || !toolName) {
        return res.status(400).json({
          success: false,
          message: "sessionId, utteranceId, and toolName are required",
        });
      }

      const result = await executeOperatorTool({
        sessionId,
        utteranceId,
        toolName,
        arguments: args,
      });

      const actionEvent = createOperatorActionEvent({
        sessionId,
        utteranceId,
        toolName,
        arguments: args,
        success: result.success,
        result: result.result,
        error: result.error,
        durationMs: result.durationMs,
      });

      console.log("[Operator][Tool]", {
        sessionId,
        toolName,
        success: result.success,
        durationMs: result.durationMs,
      });

      return res.json({
        success: result.success,
        result: result.result,
        error: result.error,
        durationMs: result.durationMs,
        actionEvent,
      });
    } catch (error: any) {
      console.error("[Operator] Tool execution failed:", error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || "Tool execution failed",
      });
    }
  });

  app.post("/api/admin/operator/session/finalize", authenticate, isAdmin, async (req, res) => {
    try {
      const payload = {
        sessionId: String(req.body?.sessionId || ""),
        transcript: Array.isArray(req.body?.transcript) ? (req.body.transcript as OperatorTranscriptLine[]) : [],
        actions: Array.isArray(req.body?.actions) ? (req.body.actions as OperatorActionEvent[]) : [],
        summary: typeof req.body?.summary === "string" ? req.body.summary : "",
        checkpoint: Boolean(req.body?.checkpoint),
      };

      if (!payload.sessionId) {
        return res.status(400).json({ success: false, message: "sessionId is required" });
      }

      const result = await finalizeOperatorSession(payload);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Operator] Failed to finalize session:", error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || "Failed to finalize session",
      });
    }
  });

  app.get("/api/admin/operator/session/:id", authenticate, isAdmin, async (req, res) => {
    const sessionId = String(req.params?.id || "");
    const session = getOperatorSession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    return res.json({ success: true, session });
  });

  app.post("/api/admin/operator/respond", authenticate, isAdmin, async (req, res) => {
    try {
      const message = String(req.body?.message || "").trim();
      const sessionId = String(req.body?.sessionId || "");
      const transcript = Array.isArray(req.body?.transcript) ? (req.body.transcript as OperatorTranscriptLine[]) : [];

      if (!message) {
        return res.status(400).json({ success: false, message: "message is required" });
      }

      const generated = await generateOperatorReply(message, transcript);
      const actions: OperatorActionEvent[] = [];

      const taskMatch = message.match(/(?:create|add|make).{0,16}task(?: called| named)?[: ]+(.+)$/i);
      if (sessionId && taskMatch?.[1]) {
        const title = taskMatch[1].trim().replace(/^["']|["']$/g, "");
        if (title.length >= 2) {
          const toolResult = await executeOperatorTool({
            sessionId,
            utteranceId: `utt_${Date.now()}`,
            toolName: "tasks_upsert",
            arguments: { title, status: "todo", details: "captured-from-voice-fallback" },
          });
          actions.push(
            createOperatorActionEvent({
              sessionId,
              utteranceId: `utt_${Date.now()}`,
              toolName: "tasks_upsert",
              arguments: { title, status: "todo", details: "captured-from-voice-fallback" },
              success: toolResult.success,
              result: toolResult.result,
              error: toolResult.error,
              durationMs: toolResult.durationMs,
            })
          );
        }
      }

      return res.json({
        success: true,
        assistantText: generated,
        actions,
      });
    } catch (error: any) {
      console.error("[Operator] respond failed:", error?.message || error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Failed to generate reply",
      });
    }
  });

  // ==================== OPERATOR VOICE CHAT (Whisper + GPT-4o + TTS) ====================

  app.post("/api/admin/operator/voice/turn", authenticate, isAdmin, voiceUpload.single("audio"), async (req, res) => {
    try {
      const sessionId = String(req.body?.sessionId || `vs_${Date.now()}`);
      const textMessage = String(req.body?.textMessage || "").trim();
      let transcript: OperatorTranscriptLine[] = [];
      try { transcript = JSON.parse(req.body?.transcript || "[]"); } catch {}

      const audioBuffer = req.file?.buffer;
      const mimeType = req.file?.mimetype || "audio/webm";

      if (!audioBuffer && !textMessage) {
        return res.status(400).json({ success: false, message: "Audio or text message is required" });
      }

      const result = await handleVoiceTurn({
        audioBuffer: audioBuffer || undefined,
        mimeType,
        textMessage: textMessage || undefined,
        transcript,
        sessionId,
      });

      console.log("[Operator][VoiceTurn]", {
        sessionId,
        userText: result.userText.slice(0, 60),
        assistantLen: result.assistantText.length,
        audioBytes: result.audioBase64.length,
        actions: result.actions.length,
      });

      return res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Operator] voice turn failed:", error?.message || error);
      return res.status(500).json({ success: false, message: error?.message || "Voice turn failed" });
    }
  });

  // ==================== ELEVENLABS VOICE AI ROUTES ====================

  // Get signed URL for ElevenLabs Conversational AI
  app.get("/api/elevenlabs/signed-url", async (req, res) => {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const AGENT_ID = "agent_7101kebbmvdcfbj8txqzhrmghh1e"; // Better Systems AI Receptionist - Aria

    if (!ELEVENLABS_API_KEY) {
      console.error("[ElevenLabs] API key not configured");
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ElevenLabs] Failed to get signed URL:", errorText);
        return res.status(response.status).json({ error: "Failed to get signed URL" });
      }

      const data = await response.json();
      console.log("[ElevenLabs] Generated signed URL for conversation");
      res.json({ signedUrl: data.signed_url });
    } catch (error: any) {
      console.error("[ElevenLabs] Error getting signed URL:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ELEVENLABS VOICE AGENT TOOLS ====================

  // Tool: Send email to visitor (client confirmation with conversation summary)
  app.post("/api/elevenlabs/tools/send-client-email", async (req, res) => {
    console.log("[ElevenLabs Tool] send-client-email called");
    console.log("[ElevenLabs Tool] Payload:", JSON.stringify(req.body).slice(0, 1000));

    try {
      const { client_email, client_name, conversation_summary, message } = req.body;

      // Validate required fields
      if (!client_email) {
        console.warn("[ElevenLabs Tool] Missing client_email");
        return res.status(400).json({
          success: false,
          error: "client_email is required",
          code: "MISSING_EMAIL"
        });
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(client_email)) {
        console.warn(`[ElevenLabs Tool] Invalid email format: ${client_email}`);
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
          code: "INVALID_EMAIL_FORMAT"
        });
      }

      // Check API key configuration
      if (!process.env.RESEND_API_KEY) {
        console.error("[ElevenLabs Tool] RESEND_API_KEY not configured");
        return res.status(500).json({
          success: false,
          error: "Email service not configured",
          code: "CONFIG_ERROR"
        });
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Thanks for Reaching Out!</h1>
            <p style="color: #94a3b8; margin-top: 8px;">Better Systems AI</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <p style="color: #fff; margin: 0; line-height: 1.7;">
              Hi${client_name ? ` ${client_name}` : ''},
            </p>
            <p style="color: #fff; margin: 16px 0 0 0; line-height: 1.7;">
              ${message || "Thanks for chatting with us! We've received your information and someone from our team will follow up shortly."}
            </p>
          </div>

          ${conversation_summary ? `
          <div style="background: rgba(96, 165, 250, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid rgba(96, 165, 250, 0.3);">
            <h2 style="color: #60a5fa; margin: 0 0 12px 0; font-size: 16px;">Conversation Summary</h2>
            <p style="color: #fff; margin: 0; line-height: 1.7; white-space: pre-wrap;">${conversation_summary}</p>
          </div>
          ` : ''}

          <div style="background: rgba(34, 197, 94, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(34, 197, 94, 0.3); text-align: center;">
            <p style="color: #22c55e; margin: 0; font-size: 14px;">
              Want to schedule a call? Visit <a href="https://bettersystems.ai/book" style="color: #22c55e; text-decoration: underline;">bettersystems.ai/book</a>
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            Better Systems AI | bettersystems.ai
          </p>
        </div>
      `;

      const emailResult = await resend.emails.send({
        from: "Better Systems AI <info@bettersystems.ai>",
        to: client_email,
        subject: "Thanks for contacting Better Systems AI!",
        html: emailHtml,
      });

      console.log(`[ElevenLabs Tool] Client email sent to: ${client_email}, ID: ${emailResult.data?.id}`);
      res.json({
        success: true,
        message: `Email sent to ${client_email}`,
        emailId: emailResult.data?.id
      });
    } catch (error: any) {
      console.error("[ElevenLabs Tool] Error sending client email:", error.message, error.stack);

      // Handle specific error types
      if (error.message?.includes("rate limit")) {
        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT"
        });
      }

      if (error.message?.includes("invalid") || error.message?.includes("Invalid")) {
        return res.status(400).json({
          success: false,
          error: "Invalid email configuration",
          code: "INVALID_CONFIG"
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to send email. Please try again.",
        code: "SEND_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // Tool: Send lead info to admin (Rodo)
  app.post("/api/elevenlabs/tools/send-admin-notification", async (req, res) => {
    console.log("[ElevenLabs Tool] send-admin-notification called");
    console.log("[ElevenLabs Tool] Payload:", JSON.stringify(req.body).slice(0, 1000));

    try {
      const { client_name, client_email, client_phone, company, needs, conversation_summary, urgency } = req.body;

      // Require at least some contact info
      if (!client_email && !client_phone && !client_name) {
        console.warn("[ElevenLabs Tool] No contact information provided");
        return res.status(400).json({
          success: false,
          error: "At least one of client_name, client_email, or client_phone is required",
          code: "MISSING_CONTACT_INFO"
        });
      }

      // Check API key configuration
      if (!process.env.RESEND_API_KEY) {
        console.error("[ElevenLabs Tool] RESEND_API_KEY not configured");
        return res.status(500).json({
          success: false,
          error: "Email service not configured",
          code: "CONFIG_ERROR"
        });
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      const urgencyEmoji: Record<string, string> = { high: "🔥", medium: "⚡", low: "📋" };
      const emoji = urgencyEmoji[urgency?.toLowerCase()] || "📞";

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">${emoji} New Lead from Voice Agent</h1>
            <p style="color: #94a3b8; margin-top: 8px;">Aria collected this information</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 8px 0; width: 100px;">Name:</td><td style="color: #fff; padding: 8px 0;"><strong>${client_name || "Not provided"}</strong></td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Email:</td><td style="color: #fff; padding: 8px 0;">${client_email ? `<a href="mailto:${client_email}" style="color: #60a5fa;">${client_email}</a>` : "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Phone:</td><td style="color: #fff; padding: 8px 0;">${client_phone || "Not provided"}</td></tr>
              <tr><td style="color: #94a3b8; padding: 8px 0;">Company:</td><td style="color: #fff; padding: 8px 0;">${company || "Not provided"}</td></tr>
            </table>
          </div>

          ${needs ? `
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px;">What They Need</h2>
            <p style="color: #fff; margin: 0; line-height: 1.7;">${needs}</p>
          </div>
          ` : ''}

          ${conversation_summary ? `
          <div style="background: rgba(96, 165, 250, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid rgba(96, 165, 250, 0.3);">
            <h2 style="color: #60a5fa; margin: 0 0 12px 0; font-size: 16px;">Conversation Summary</h2>
            <p style="color: #fff; margin: 0; line-height: 1.7; white-space: pre-wrap;">${conversation_summary}</p>
          </div>
          ` : ''}

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            Sent from Better Systems AI Voice Agent
          </p>
        </div>
      `;

      const emailResult = await resend.emails.send({
        from: "Better Systems AI <info@bettersystems.ai>",
        to: "rodolfo@bettersystems.ai",
        subject: `${emoji} Voice Agent Lead: ${client_name || "New Visitor"}${company ? ` @ ${company}` : ""}`,
        html: emailHtml,
      });

      console.log(`[ElevenLabs Tool] Admin notification sent to rodolfo@bettersystems.ai, ID: ${emailResult.data?.id}`);
      res.json({
        success: true,
        message: "Admin notification sent",
        emailId: emailResult.data?.id
      });
    } catch (error: any) {
      console.error("[ElevenLabs Tool] Error sending admin notification:", error.message, error.stack);

      // Handle specific error types
      if (error.message?.includes("rate limit")) {
        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT"
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to send admin notification",
        code: "SEND_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // ElevenLabs Voice Agent Webhook - Post-call notifications with AI analysis
  // IMPORTANT: Only sends notification if contact information was collected
  app.post("/api/webhooks/elevenlabs", async (req, res) => {
    console.log("[ElevenLabs Webhook] Received post-call data");
    console.log("[ElevenLabs Webhook] Payload keys:", Object.keys(req.body || {}));

    try {
      const payload = req.body;

      // Log full payload for debugging (first 2000 chars)
      console.log("[ElevenLabs Webhook] Full payload:", JSON.stringify(payload).slice(0, 2000));

      // ElevenLabs sends data in different formats depending on event type
      // Handle the transcript event format
      const data = payload.data || payload;

      // Extract conversation data - ElevenLabs format
      const conversationId = data.conversation_id || data.id || payload.conversation_id || "unknown";

      // ElevenLabs transcript format: array of {role, message} or {role, content}
      const transcript = data.transcript || data.messages || payload.transcript || [];
      const duration = data.call_duration_secs || data.duration || payload.duration || 0;

      // Format transcript for analysis
      let transcriptText = "";
      if (Array.isArray(transcript)) {
        transcriptText = transcript.map((msg: any) => {
          const role = msg.role === "agent" ? "Aria" : "Visitor";
          const content = msg.message || msg.content || msg.text || "";
          return `${role}: ${content}`;
        }).join("\n\n");
      } else if (typeof transcript === "string") {
        transcriptText = transcript;
      }

      console.log("[ElevenLabs Webhook] Transcript length:", transcriptText.length);
      console.log("[ElevenLabs Webhook] Transcript preview:", transcriptText.slice(0, 500));

      // Skip if no meaningful transcript
      if (!transcriptText || transcriptText.trim().length < 20) {
        console.log("[ElevenLabs Webhook] Skipping - no meaningful transcript");
        return res.json({ success: true, skipped: true, reason: "no_transcript" });
      }

      // Analyze the conversation with AI
      console.log("[ElevenLabs Webhook] Analyzing conversation with AI...");
      const analysis = await analyzeVoiceAgentLead(transcriptText);
      console.log(`[ElevenLabs Webhook] Lead score: ${analysis.qualification.score}`);
      console.log(`[ElevenLabs Webhook] Contact info found - Email: ${analysis.contactInfo.email || 'none'}, Phone: ${analysis.contactInfo.phone || 'none'}`);

      // CRITICAL: Only send notification if contact information was collected
      // This ensures we only get notified about qualified leads with contact details
      const hasContactInfo = !!(analysis.contactInfo.email || analysis.contactInfo.phone);

      if (!hasContactInfo) {
        console.log("[ElevenLabs Webhook] Skipping - no contact information collected");
        return res.json({
          success: true,
          skipped: true,
          reason: "no_contact_info",
          conversationId,
          leadScore: analysis.qualification.score,
          message: "No email or phone collected - notification not sent"
        });
      }

      // Format the email HTML with AI insights
      const emailHtml = formatLeadEmailHtml(analysis, transcriptText, conversationId, duration);

      // Check API key configuration
      if (!process.env.RESEND_API_KEY) {
        console.error("[ElevenLabs Webhook] RESEND_API_KEY not configured");
        return res.status(500).json({
          success: false,
          error: "Email service not configured",
          code: "CONFIG_ERROR"
        });
      }

      // Send to Rodo's personal email with AI-powered subject line
      const resend = new Resend(process.env.RESEND_API_KEY);
      const scoreEmoji: Record<string, string> = { hot: "🔥", warm: "⚡", cold: "❄️", not_qualified: "⏸️" };
      const emoji = scoreEmoji[analysis.qualification.score] || "📞";

      const subjectParts = [
        `${emoji} [${analysis.qualification.score.toUpperCase()}]`,
        analysis.contactInfo.name || "Website Visitor",
        analysis.contactInfo.company ? `@ ${analysis.contactInfo.company}` : "",
        "- Voice Agent Lead"
      ].filter(Boolean);

      const emailResult = await resend.emails.send({
        from: process.env.EMAIL_FROM || "Better Systems AI <noreply@bettersystemsai.com>",
        to: "rodolfo@bettersystems.ai",
        subject: subjectParts.join(" "),
        html: emailHtml,
      });

      console.log(`[ElevenLabs Webhook] AI-enhanced notification sent for conversation ${conversationId}, Email ID: ${emailResult.data?.id}`);
      res.json({
        success: true,
        conversationId,
        leadScore: analysis.qualification.score,
        contactExtracted: true,
        contactInfo: {
          hasEmail: !!analysis.contactInfo.email,
          hasPhone: !!analysis.contactInfo.phone,
          hasName: !!analysis.contactInfo.name
        },
        emailId: emailResult.data?.id
      });
    } catch (error: any) {
      console.error("[ElevenLabs Webhook] Error:", error.message, error.stack);

      // Handle specific error types
      if (error.message?.includes("rate limit")) {
        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded",
          code: "RATE_LIMIT"
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to process webhook",
        code: "PROCESSING_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // ==================== PLAUD WEBHOOK & RECORDINGS ====================

  // Plaud webhook (no auth required - HMAC signature verification)
  app.post("/api/webhooks/plaud", handlePlaudWebhook);

  // Recordings CRUD (protected)
  app.get("/api/admin/recordings", authenticate, isAdmin, getAllRecordings);
  app.get("/api/admin/recordings/:id", authenticate, isAdmin, getRecordingById);
  app.put("/api/admin/recordings/:id", authenticate, isAdmin, updateRecording);
  app.post("/api/admin/recordings/:id/retranscribe", authenticate, isAdmin, retranscribeRecording);
  app.delete("/api/admin/recordings/:id", authenticate, isAdmin, deleteRecording);

  // ==================== KNOWLEDGE BASE ENDPOINTS ====================

  // Knowledge Base entries
  app.get("/api/admin/knowledge-base/entries", authenticate, isAdmin, async (req, res) => {
    try {
      const entries = await db.execute(sql`
        SELECT kb.*, c.name as client_name, d.name as deal_name
        FROM knowledge_base kb
        LEFT JOIN clients c ON kb.client_id = c.id
        LEFT JOIN deals d ON kb.deal_id = d.id
        WHERE kb.status != 'archived'
        ORDER BY kb.pinned DESC, kb.created_at DESC
        LIMIT 200
      `);
      res.json(entries.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/knowledge-base/entries", authenticate, isAdmin, async (req, res) => {
    try {
      const { title, content, content_type, company, project, category, tags, client_id, deal_id, event_date, source } = req.body;
      const result = await db.execute(sql`
        INSERT INTO knowledge_base (title, content, content_type, company, project, category, tags, client_id, deal_id, event_date, source)
        VALUES (${title}, ${content}, ${content_type || 'note'}, ${company || 'bsa'}, ${project || null}, ${category || null},
          ${tags || null}, ${client_id || null}, ${deal_id || null}, ${event_date || null}, ${source || 'manual'})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/knowledge-base/entries/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, content_type, company, project, category, status, pinned } = req.body;
      const result = await db.execute(sql`
        UPDATE knowledge_base SET
          title = COALESCE(${title}, title),
          content = COALESCE(${content}, content),
          content_type = COALESCE(${content_type}, content_type),
          company = COALESCE(${company}, company),
          project = COALESCE(${project}, project),
          category = COALESCE(${category}, category),
          status = COALESCE(${status}, status),
          pinned = COALESCE(${pinned}, pinned),
          updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Action Items
  app.get("/api/admin/knowledge-base/actions", authenticate, isAdmin, async (req, res) => {
    try {
      const items = await db.execute(sql`
        SELECT * FROM action_items
        WHERE status NOT IN ('needs_review')
        ORDER BY
          CASE status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'snoozed' THEN 2 WHEN 'completed' THEN 3 WHEN 'dismissed' THEN 4 ELSE 5 END,
          CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
          due_date ASC NULLS LAST,
          created_at DESC
        LIMIT 200
      `);
      res.json(items.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/knowledge-base/actions", authenticate, isAdmin, async (req, res) => {
    try {
      const { title, description, assigned_to, company, project, priority, due_date, client_id, deal_id, source } = req.body;
      const result = await db.execute(sql`
        INSERT INTO action_items (title, description, assigned_to, company, project, priority, due_date, client_id, deal_id, source)
        VALUES (${title}, ${description || null}, ${assigned_to || null}, ${company || 'bsa'}, ${project || null},
          ${priority || 'medium'}, ${due_date || null}, ${client_id || null}, ${deal_id || null}, ${source || 'manual'})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/knowledge-base/actions/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, status, priority, assigned_to, due_date } = req.body;
      const completedClause = status === 'completed' ? sql`completed_at = NOW(),` : sql``;
      const result = await db.execute(sql`
        UPDATE action_items SET
          title = COALESCE(${title || null}, title),
          description = COALESCE(${description || null}, description),
          status = COALESCE(${status || null}, status),
          priority = COALESCE(${priority || null}, priority),
          assigned_to = COALESCE(${assigned_to || null}, assigned_to),
          due_date = COALESCE(${due_date || null}, due_date),
          updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `);
      // Set completed_at separately if completing
      if (status === 'completed') {
        await db.execute(sql`UPDATE action_items SET completed_at = NOW() WHERE id = ${parseInt(id)}`);
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Context Snapshots
  app.get("/api/admin/knowledge-base/snapshots", authenticate, isAdmin, async (req, res) => {
    try {
      const snapshots = await db.execute(sql`
        SELECT * FROM context_snapshots ORDER BY generated_at DESC LIMIT 30
      `);
      res.json(snapshots.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Context Retrieval API (for Claude Code / OpenClaw startup) ───
  // Uses simple bearer token auth (CONTEXT_API_KEY in .env) so it's callable from scripts
  app.get("/api/context/briefing", async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedKey = process.env.CONTEXT_API_KEY || process.env.JWT_SECRET;
    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Get latest snapshot
      const latestSnapshot = await db.execute(sql`
        SELECT briefing, generated_at FROM context_snapshots
        ORDER BY generated_at DESC LIMIT 1
      `);

      // Get live pending actions
      const pendingActions = await db.execute(sql`
        SELECT id, title, description, assigned_to, company, project, priority, due_date
        FROM action_items WHERE status IN ('pending', 'in_progress')
        ORDER BY
          CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
          due_date ASC NULLS LAST
      `);

      // Get recent recordings (last 7 days)
      const recentRecordings = await db.execute(sql`
        SELECT id, title, summary, recorded_at, duration_seconds, metadata
        FROM recordings
        WHERE transcription_status = 'completed'
        AND recorded_at > NOW() - INTERVAL '7 days'
        ORDER BY recorded_at DESC
      `);

      // Get pinned KB entries
      const pinnedKB = await db.execute(sql`
        SELECT title, content, company, project, category
        FROM knowledge_base WHERE pinned = true AND status = 'published'
        ORDER BY updated_at DESC
      `);

      res.json({
        briefing: latestSnapshot.rows[0]?.briefing || null,
        briefing_generated: latestSnapshot.rows[0]?.generated_at || null,
        pending_actions: pendingActions.rows,
        recent_recordings: recentRecordings.rows,
        pinned_knowledge: pinnedKB.rows,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Context: Get project-specific context
  app.get("/api/context/project/:project", async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedKey = process.env.CONTEXT_API_KEY || process.env.JWT_SECRET;
    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const project = decodeURIComponent(req.params.project);

      const kbEntries = await db.execute(sql`
        SELECT title, content, content_type, category, updated_at
        FROM knowledge_base WHERE project = ${project} AND status = 'published'
        ORDER BY pinned DESC, updated_at DESC
      `);

      const actions = await db.execute(sql`
        SELECT id, title, description, status, priority, due_date
        FROM action_items WHERE project = ${project}
        ORDER BY status ASC, priority ASC, due_date ASC NULLS LAST
      `);

      const recordings = await db.execute(sql`
        SELECT id, title, summary, recorded_at, duration_seconds
        FROM recordings WHERE metadata->>'topics' ILIKE ${`%${project}%`}
        ORDER BY recorded_at DESC LIMIT 5
      `);

      res.json({
        project,
        knowledge: kbEntries.rows,
        actions: actions.rows,
        related_recordings: recordings.rows,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==================== PRESENTATION LEADS ====================
  app.post("/api/presentation-leads", async (req, res) => {
    try {
      const { name, email, phone, category, interestedInHelp, presentation } = req.body;

      if (!name || !email || !category) {
        return res.status(400).json({ error: "Name, email, and category are required" });
      }

      // Store in database
      await db.insert(presentationLeads).values({
        name,
        email,
        phone: phone || null,
        category,
        interestedInHelp: interestedInHelp || false,
        presentation: presentation || "cgcc-ai-2026",
      });

      // Send notification email via Resend
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Better Systems AI <developer@bettersystems.ai>",
          to: "rodolfo@bettersystems.ai",
          subject: `New Presentation Lead: ${name}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 40px; border-radius: 16px;">
              <h1 style="color: #fff; margin: 0 0 8px 0; font-size: 24px;">New Presentation Lead</h1>
              <p style="color: #94a3b8; margin: 0 0 24px 0;">Someone downloaded the AI presentation</p>
              <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Name</td><td style="color: #fff; padding: 8px 0; text-align: right;"><strong>${name}</strong></td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #fff; padding: 8px 0; text-align: right;"><a href="mailto:${email}" style="color: #60a5fa;">${email}</a></td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Phone</td><td style="color: #fff; padding: 8px 0; text-align: right;">${phone || "Not provided"}</td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Category</td><td style="color: #fff; padding: 8px 0; text-align: right;">${category}</td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Wants AI Help</td><td style="color: #fff; padding: 8px 0; text-align: right;">${interestedInHelp ? '<span style="color: #22c55e; font-weight: bold;">YES</span>' : "No"}</td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Presentation</td><td style="color: #fff; padding: 8px 0; text-align: right;">${presentation || "cgcc-ai-2026"}</td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Submitted</td><td style="color: #fff; padding: 8px 0; text-align: right;">${new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" })}</td></tr>
                </table>
              </div>
              ${interestedInHelp ? '<div style="margin-top: 16px; padding: 12px 16px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; color: #22c55e; font-weight: 600; text-align: center;">This person wants help integrating AI systems</div>' : ""}
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send presentation lead notification:", emailErr);
        // Don't fail the request if email fails
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Presentation lead error:", error);
      res.status(500).json({ error: "Failed to save lead" });
    }
  });

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

      // Handle payment link checkout completions — update invoice + notify admin
      if (result.type === "checkout_completed") {
        const session = result.data as any;
        const invoiceNumber = session.metadata?.invoice_number;
        const amountPaid = (session.amount_total || 0) / 100;
        const customerEmail = session.customer_details?.email || session.customer_email || "unknown";

        console.log(`[Stripe Webhook] Payment received: ${invoiceNumber}, $${amountPaid}, ${customerEmail}`);

        // Update invoice in database
        if (invoiceNumber) {
          try {
            await db.execute(
              sql`UPDATE invoices SET status = 'paid', amount_paid = ${amountPaid}, amount_due = 0, paid_at = NOW(), updated_at = NOW() WHERE invoice_number = ${invoiceNumber}`
            );
            console.log(`[Stripe Webhook] Invoice ${invoiceNumber} marked as paid`);
          } catch (dbErr) {
            console.error(`[Stripe Webhook] Failed to update invoice:`, dbErr);
          }
        }

        // Send admin notification
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "Better Systems AI <info@bettersystems.ai>",
            to: "rodolfo@bettersystems.ai",
            subject: `💰 Payment Received: $${amountPaid.toFixed(2)} — ${invoiceNumber || "Unknown Invoice"}`,
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0f1a; color: #fff; padding: 32px; border-radius: 12px;">
                <h1 style="color: #22c55e; margin: 0 0 20px; font-size: 24px; text-align: center;">Payment Received</h1>
                <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0;">$${amountPaid.toFixed(2)}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Invoice</td><td style="color: #fff; text-align: right;">${invoiceNumber || "N/A"}</td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Customer Email</td><td style="color: #fff; text-align: right;">${customerEmail}</td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Payment Type</td><td style="color: #fff; text-align: right;">${session.metadata?.type === "early_discount" ? "Early Payment (5% discount)" : "Full Price"}</td></tr>
                  <tr><td style="color: #94a3b8; padding: 8px 0;">Date</td><td style="color: #fff; text-align: right;">${new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" })}</td></tr>
                </table>
                <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 20px;">Stripe Checkout Session: ${session.id}</p>
              </div>
            `,
          });
          console.log(`[Stripe Webhook] Admin payment notification sent`);
        } catch (emailErr) {
          console.error(`[Stripe Webhook] Failed to send admin notification:`, emailErr);
        }
      }

      res.json({ received: true, type: result.type });
    } catch (error: any) {
      console.error("[Stripe Webhook] Error:", error.message);
      return res.status(400).json({ error: error.message });
    }
  });

  // ==================== DEV TRACKER ====================
  // Role-gated project tracker backed by qa_items + qa_notes.
  // owner: full CRUD. developer: read + status updates + add/resolve notes.

  app.get("/api/dev-tracker/items", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const project = req.query.project as string | undefined;
      // Developers see ALL items (full context like admin); they're still gated by role above.
      // Write access is restricted in PATCH/DELETE handlers below.
      const itemsRes: any = project
        ? await db.execute(sql`SELECT * FROM qa_items WHERE project = ${project} ORDER BY version DESC, sort_order ASC, created_at ASC`)
        : await db.execute(sql`SELECT * FROM qa_items ORDER BY version DESC, sort_order ASC, created_at ASC`);
      const items = itemsRes.rows || itemsRes;
      if (!items.length) return res.json(project ? [] : {});
      const ids = items.map((i: any) => i.id);
      const idsCsv = ids.map((x: string) => `'${x}'::uuid`).join(",");
      const notesRes: any = await db.execute(sql.raw(`SELECT * FROM qa_notes WHERE item_id IN (${idsCsv}) ORDER BY created_at ASC`));
      const notes = notesRes.rows || notesRes;
      const byItem = new Map<string, any[]>();
      for (const n of notes) {
        const arr = byItem.get(n.item_id) || [];
        arr.push(n);
        byItem.set(n.item_id, arr);
      }
      // Attachments
      const attRes: any = await db.execute(sql.raw(`SELECT * FROM qa_attachments WHERE item_id IN (${idsCsv}) ORDER BY created_at ASC`));
      const atts = attRes.rows || attRes;
      const attByItem = new Map<string, any[]>();
      for (const a of atts) {
        const arr = attByItem.get(a.item_id) || [];
        arr.push(a);
        attByItem.set(a.item_id, arr);
      }
      if (project) {
        return res.json(items.map((it: any) => ({ ...it, notes: byItem.get(it.id) || [], attachments: attByItem.get(it.id) || [] })));
      }
      const projects: Record<string, any[]> = {};
      for (const it of items) {
        const key = it.project;
        if (!projects[key]) projects[key] = [];
        projects[key].push({ ...it, notes: byItem.get(it.id) || [], attachments: attByItem.get(it.id) || [] });
      }
      res.json(projects);
    } catch (e: any) {
      console.error("dev-tracker items:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dev-tracker/projects", authenticate, hasRole(["owner", "admin", "developer"]), async (_req, res) => {
    try {
      const r: any = await db.execute(sql`SELECT project, COUNT(*)::int AS count FROM qa_items GROUP BY project ORDER BY project`);
      res.json(r.rows || r);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dev-tracker/invoices", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const project = (req.query.project as string) || null;
      const invR: any = project
        ? await db.execute(sql`SELECT * FROM qa_invoices WHERE project = ${project} ORDER BY issued_date DESC`)
        : await db.execute(sql`SELECT * FROM qa_invoices ORDER BY issued_date DESC`);
      const invoices = invR.rows || invR;
      if (!invoices.length) return res.json([]);
      const linkedR: any = project
        ? await db.execute(sql`SELECT id, invoice_number, bundle, title, version, status, sort_order, paid_at, invoiced_at FROM qa_items WHERE invoice_number IS NOT NULL AND project = ${project} ORDER BY invoice_number, bundle NULLS LAST, sort_order`)
        : await db.execute(sql`SELECT id, invoice_number, bundle, title, version, status, sort_order, paid_at, invoiced_at FROM qa_items WHERE invoice_number IS NOT NULL ORDER BY invoice_number, bundle NULLS LAST, sort_order`);
      const linkedAll = linkedR.rows || linkedR;
      const grouped: Record<string, any[]> = {};
      for (const it of linkedAll) {
        if (!grouped[it.invoice_number]) grouped[it.invoice_number] = [];
        grouped[it.invoice_number].push(it);
      }
      res.json(invoices.map((inv: any) => ({ ...inv, linked_items: grouped[inv.invoice_number] || [] })));
    } catch (e: any) {
      console.error("dev-tracker invoices error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/dev-tracker/items", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const b = req.body || {};
      const r: any = await db.execute(sql`
        INSERT INTO qa_items (project, version, category, title, description, source, source_date, status, sort_order, assignee)
        VALUES (${b.project || "mitchs-map"}, ${b.version || "2.4"}, ${b.category || "feature"},
                ${b.title || "Untitled"}, ${b.description || null}, ${b.source || null}, ${b.source_date || null},
                ${b.status || "open"}, ${b.sort_order ?? 0}, ${b.assignee || null})
        RETURNING *
      `);
      const row = (r.rows || r)[0];
      res.json({ ...row, notes: [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/dev-tracker/items/:id", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const b = req.body || {};
      // Single tracker — every signed-in user can edit any field.
      const allowed = [
        "status", "version", "category", "title", "description", "charged", "commit_hash", "amount_cents",
        "source", "source_date", "source_context", "source_ref", "sort_order", "assignee",
        "delivered_at", "invoiced_at", "paid_at", "invoice_number", "bundle", "stripe_charge_id",
      ];
      const sets: any[] = [];
      for (const k of allowed) {
        if (k in b) sets.push(sql`${sql.raw(`"${k}"`)} = ${b[k]}`);
      }
      if (b.status === "tested_pass" || b.status === "tested_fail") sets.push(sql`tested_at = NOW()`);
      if (b.status === "shipped") sets.push(sql`deployed_at = COALESCE(deployed_at, NOW())`);
      sets.push(sql`updated_at = NOW()`);
      if (sets.length === 1) return res.status(400).json({ error: "No valid fields" });
      const setExpr = sets.reduce((acc, s, i) => (i === 0 ? s : sql`${acc}, ${s}`));
      const r: any = await db.execute(sql`UPDATE qa_items SET ${setExpr} WHERE id = ${id}::uuid RETURNING *`);
      const row = (r.rows || r)[0];
      const notesRes: any = await db.execute(sql`SELECT * FROM qa_notes WHERE item_id = ${id}::uuid ORDER BY created_at ASC`);
      res.json({ ...row, notes: notesRes.rows || notesRes });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/dev-tracker/items/:id", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      // Single tracker — every signed-in user can delete any item.
      await db.execute(sql`DELETE FROM qa_items WHERE id = ${req.params.id}::uuid`);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // === Attachments — drag/drop files (images, screenshots, videos, docs) ===
  app.post(
    "/api/dev-tracker/items/:id/attachments",
    authenticate,
    hasRole(["owner", "admin", "developer"]),
    attachmentUpload.array("files", 10),
    async (req, res) => {
      try {
        if (!supabaseStorage) return res.status(503).json({ error: "Storage not configured" });
        const itemId = req.params.id;
        const user = (req as any).user;
        const files = (req.files as Express.Multer.File[]) || [];
        if (!files.length) return res.status(400).json({ error: "No files uploaded" });

        // Verify item exists. Single tracker — anyone signed in can attach to anything.
        const itemRes: any = await db.execute(sql`SELECT id FROM qa_items WHERE id = ${itemId}::uuid`);
        if (!(itemRes.rows || itemRes)[0]) return res.status(404).json({ error: "Item not found" });

        const uploaded: any[] = [];
        for (const f of files) {
          const safe = f.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${itemId}/${Date.now()}_${safe}`;
          const { error: upErr } = await supabaseStorage.storage
            .from(ATTACHMENTS_BUCKET)
            .upload(storagePath, f.buffer, { contentType: f.mimetype, upsert: false });
          if (upErr) {
            console.error("[Attachment] upload error:", upErr);
            return res.status(500).json({ error: upErr.message });
          }
          const { data: pub } = supabaseStorage.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(storagePath);
          const r: any = await db.execute(sql`
            INSERT INTO qa_attachments (item_id, filename, mime_type, size_bytes, storage_path, public_url, uploaded_by)
            VALUES (${itemId}::uuid, ${f.originalname}, ${f.mimetype}, ${f.size}, ${storagePath}, ${pub.publicUrl}, ${user.username || "unknown"})
            RETURNING *
          `);
          uploaded.push((r.rows || r)[0]);
        }
        await db.execute(sql`UPDATE qa_items SET updated_at = NOW() WHERE id = ${itemId}::uuid`);
        res.json(uploaded);
      } catch (e: any) {
        console.error("[Attachment] error:", e);
        res.status(500).json({ error: e.message });
      }
    }
  );

  app.delete("/api/dev-tracker/attachments/:id", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      if (!supabaseStorage) return res.status(503).json({ error: "Storage not configured" });
      const id = req.params.id;
      const r: any = await db.execute(sql`SELECT * FROM qa_attachments WHERE id = ${id}::uuid`);
      const att = (r.rows || r)[0];
      if (!att) return res.status(404).json({ error: "Not found" });
      // Single tracker — anyone signed in can delete attachments
      const { error: delErr } = await supabaseStorage.storage.from(ATTACHMENTS_BUCKET).remove([att.storage_path]);
      if (delErr) console.warn("[Attachment] storage delete failed (continuing):", delErr.message);
      await db.execute(sql`DELETE FROM qa_attachments WHERE id = ${id}::uuid`);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Convenience: mark an item paid (sets paid_at = NOW + optional invoice/charge refs)
  app.post("/api/dev-tracker/items/:id/mark-paid", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const b = req.body || {};
      const sets: any[] = [sql`paid_at = NOW()`];
      if (b.invoice_number) sets.push(sql`invoice_number = ${b.invoice_number}`);
      if (b.stripe_charge_id) sets.push(sql`stripe_charge_id = ${b.stripe_charge_id}`);
      sets.push(sql`invoiced_at = COALESCE(invoiced_at, NOW())`); // ensure invoiced is also set
      sets.push(sql`updated_at = NOW()`);
      const setExpr = sets.reduce((acc, s, i) => (i === 0 ? s : sql`${acc}, ${s}`));
      const r: any = await db.execute(sql`UPDATE qa_items SET ${setExpr} WHERE id = ${id}::uuid RETURNING *`);
      res.json((r.rows || r)[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/dev-tracker/items/:id/notes", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const user = (req as any).user;
      const b = req.body || {};
      const author = user.username || "unknown";
      const r: any = await db.execute(sql`
        INSERT INTO qa_notes (item_id, text, author)
        VALUES (${id}::uuid, ${b.text || ""}, ${author})
        RETURNING *
      `);
      await db.execute(sql`UPDATE qa_items SET updated_at = NOW() WHERE id = ${id}::uuid`);
      res.json((r.rows || r)[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/dev-tracker/items/:id/notes/:noteId", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const { noteId } = req.params;
      const user = (req as any).user;
      const b = req.body || {};
      const sets: any[] = [];
      if ("text" in b) sets.push(sql`text = ${b.text}`);
      if (b.resolved === true) {
        sets.push(sql`resolved_at = NOW()`);
        sets.push(sql`resolved_by = ${user.username || "unknown"}`);
      }
      if (b.resolved === false) {
        sets.push(sql`resolved_at = NULL`);
        sets.push(sql`resolved_by = NULL`);
      }
      if (!sets.length) return res.status(400).json({ error: "No updates" });
      const setExpr = sets.reduce((acc, s, i) => (i === 0 ? s : sql`${acc}, ${s}`));
      const r: any = await db.execute(sql`UPDATE qa_notes SET ${setExpr} WHERE id = ${noteId}::uuid RETURNING *`);
      res.json((r.rows || r)[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // === User management (admin only) — onboard developers, reset passwords, manage roles ===
  app.get("/api/dev-tracker/users", authenticate, hasRole(["owner", "admin", "developer"]), async (_req, res) => {
    try {
      const r: any = await db.execute(sql`SELECT id, username, name, email, role, "createdAt" FROM bettersystems.users ORDER BY id`);
      res.json(r.rows || r);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/dev-tracker/users", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const b = req.body || {};
      if (!b.username || !b.name || !b.email || !b.password) {
        return res.status(400).json({ error: "Missing required fields: username, name, email, password" });
      }
      const role = b.role && ["developer", "admin", "owner"].includes(b.role) ? b.role : "developer";
      const bcryptMod = await import("bcrypt");
      const hash = bcryptMod.default.hashSync(b.password, 10);
      const r: any = await db.execute(sql`
        INSERT INTO bettersystems.users (username, name, email, password, role)
        VALUES (${b.username}, ${b.name}, ${b.email}, ${hash}, ${role})
        RETURNING id, username, name, email, role, "createdAt"
      `);
      res.json((r.rows || r)[0]);
    } catch (e: any) {
      if (String(e.message).includes("duplicate")) return res.status(409).json({ error: "Username or email already exists" });
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/dev-tracker/users/:id", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const b = req.body || {};
      const sets: any[] = [];
      if (b.name) sets.push(sql`name = ${b.name}`);
      if (b.email) sets.push(sql`email = ${b.email}`);
      if (b.role && ["developer", "admin", "owner"].includes(b.role)) sets.push(sql`role = ${b.role}`);
      if (b.password) {
        const bcryptMod = await import("bcrypt");
        const hash = bcryptMod.default.hashSync(b.password, 10);
        sets.push(sql`password = ${hash}`);
      }
      if (!sets.length) return res.status(400).json({ error: "No updates" });
      sets.push(sql`"updatedAt" = NOW()`);
      const setExpr = sets.reduce((acc, s, i) => (i === 0 ? s : sql`${acc}, ${s}`));
      const r: any = await db.execute(sql`UPDATE bettersystems.users SET ${setExpr} WHERE id = ${id} RETURNING id, username, name, email, role`);
      res.json((r.rows || r)[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/dev-tracker/users/:id", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const me = (req as any).user;
      if (me.id === id) return res.status(400).json({ error: "Cannot delete yourself" });
      await db.execute(sql`UPDATE qa_items SET assignee = NULL WHERE assignee IN (SELECT username FROM bettersystems.users WHERE id = ${id})`);
      await db.execute(sql`DELETE FROM bettersystems.users WHERE id = ${id}`);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dev-tracker/unresolved", authenticate, hasRole(["owner", "admin", "developer"]), async (req, res) => {
    try {
      const project = (req.query.project as string) || "mitchs-map";
      const r: any = await db.execute(sql`
        SELECT n.id AS note_id, n.text, n.created_at AS note_created_at,
               i.id AS item_id, i.title, i.version, i.status
        FROM qa_notes n
        JOIN qa_items i ON i.id = n.item_id
        WHERE n.resolved_at IS NULL AND i.project = ${project}
        ORDER BY n.created_at ASC
      `);
      res.json(r.rows || r);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
