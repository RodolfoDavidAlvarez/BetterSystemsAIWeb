import './loadEnv';
import type { Express } from "express";
import { login, register, getCurrentUser } from './controllers/auth';
import { authenticate, isAdmin } from './middleware/auth';
import { sendCustomerEmail, sendAdminNotification } from './services/email';
import { saveToAirtable } from './services/airtable';

// CRM Controllers
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
} from './controllers/clients';

import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
} from './controllers/projects';

import {
  getProjectUpdates,
  createProjectUpdate,
  sendUpdateToClient,
  updateProjectUpdate,
  deleteProjectUpdate
} from './controllers/projectUpdates';

import {
  getActivityLog,
  logActivity,
  getActivityStats
} from './controllers/activity';

import {
  syncAllStripeData,
  syncStripeCustomers,
  syncStripeInvoices,
  syncStripePaymentIntents,
  syncStripeSubscriptions,
  createInvoice,
  createPaymentLinkForClient,
  getBillingDashboard
} from './controllers/billing';

import { constructWebhookEvent, handleWebhookEvent } from './services/stripe';

export function registerRoutes(app: Express) {
  // Public API routes
  app.post("/api/contact", async (req, res) => {
    console.log('Contact API endpoint hit');
    try {
      console.log('Processing contact request:', req.body);
      
      // Extract form data
      const formData = {
        ...req.body,
        formType: req.body.formIdentifier || 'Contact Form',
        submittedAt: new Date().toISOString()
      };

      // Save to Airtable
      const airtableResult = await saveToAirtable(formData);
      if (!airtableResult.success) {
        console.error('Airtable save failed:', airtableResult.error);
      }

      // Send customer confirmation email
      const customerEmailResult = await sendCustomerEmail(formData);
      if (!customerEmailResult.success) {
        console.error('Customer email failed:', customerEmailResult.error);
      }

      // Send admin notification
      const adminEmailResult = await sendAdminNotification(formData);
      if (!adminEmailResult.success) {
        console.error('Admin email failed:', adminEmailResult.error);
      }

      res.json({ 
        success: true, 
        message: "Your submission has been received. Check your email for confirmation.",
        recordId: airtableResult.recordId
      });
    } catch (error) {
      console.error('Contact API error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process your submission. Please try again." 
      });
    }
  });
  
  // Client Onboarding endpoint
  app.post("/api/client-onboarding", async (req, res) => {
    console.log('Client onboarding API endpoint hit');
    try {
      console.log('Processing onboarding data:', req.body);
      
      // Extract form data
      const onboardingData = {
        ...req.body,
        formType: 'Client Onboarding',
        submittedAt: new Date().toISOString()
      };

      // Save to Airtable
      const airtableResult = await saveToAirtable(onboardingData);
      if (!airtableResult.success) {
        console.error('Airtable save failed:', airtableResult.error);
      }

      // Send customer confirmation email
      const customerEmailResult = await sendCustomerEmail({
        ...onboardingData,
        email: onboardingData.primaryContactEmail,
        name: onboardingData.primaryContactName,
        formIdentifier: 'Client Onboarding'
      });
      if (!customerEmailResult.success) {
        console.error('Customer email failed:', customerEmailResult.error);
      }

      // Send admin notification
      const adminEmailResult = await sendAdminNotification({
        ...onboardingData,
        formIdentifier: 'Client Onboarding'
      });
      if (!adminEmailResult.success) {
        console.error('Admin email failed:', adminEmailResult.error);
      }

      res.json({ 
        success: true, 
        message: "Onboarding information received successfully.",
        recordId: airtableResult.recordId
      });
    } catch (error) {
      console.error('Client onboarding API error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process onboarding information. Please try again." 
      });
    }
  });
  
  // Auth routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.get("/api/auth/me", authenticate, getCurrentUser);
  
  // Emergency test endpoint for debugging auth issues
  app.get("/api/auth/test", (req, res) => {
    console.log('Auth test endpoint accessed');
    res.json({
      success: true,
      message: 'Auth API is accessible',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
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
        message: 'Dashboard stats endpoint - use individual stat endpoints for data'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  });

  // ==================== BILLING & STRIPE ROUTES ====================

  // Billing Dashboard
  app.get("/api/admin/billing/dashboard", authenticate, isAdmin, getBillingDashboard);

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

  // Stripe Webhook (no auth required - Stripe signature verification instead)
  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    try {
      // Construct the event using the raw body
      const event = constructWebhookEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle the event
      const result = await handleWebhookEvent(event);

      console.log(`[Stripe Webhook] Processed ${event.type}:`, result);

      res.json({ received: true, type: result.type });
    } catch (error: any) {
      console.error('[Stripe Webhook] Error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  });
}