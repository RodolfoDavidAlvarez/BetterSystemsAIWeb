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

import { getAllDeals, getDealById, createDeal, updateDeal, deleteDeal, addDealInteraction, getDealInteractions } from "./controllers/deals";

import { getDocuments, uploadDocument, deleteDocument, updateDocument, upload } from "./controllers/documents";

import { sendDealUpdate, getEmailTemplates, previewEmail } from "./controllers/dealUpdates";

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

import {
  receiveExternalTicket,
  getExternalTicketStatus,
  externalTicketsHealthCheck,
} from "./controllers/externalTickets";

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
  app.post("/api/auth/login", login);
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

  // Deal updates (email)
  app.post("/api/admin/deals/:id/send-update", authenticate, isAdmin, sendDealUpdate);
  app.post("/api/admin/deals/preview-email", authenticate, isAdmin, previewEmail);
  app.get("/api/admin/email-templates", authenticate, isAdmin, getEmailTemplates);

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
