import './loadEnv';
import type { Express } from "express";
import { login, register, getCurrentUser } from './controllers/auth';
import { authenticate } from './middleware/auth';
import { sendCustomerEmail, sendAdminNotification } from './services/email';
import { saveToAirtable } from './services/airtable';

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
  
  // Blog and admin endpoints have been removed
  
  // Public blog routes - DISABLED
  // app.get("/api/blog", getAllBlogPosts);
  // app.get("/api/blog/:slug", getBlogPostBySlug);
  
  // Protected admin blog routes - DISABLED
  // app.post("/api/admin/blog", authenticate, isAdmin, createBlogPost);
  // app.get("/api/admin/blog", authenticate, isAdmin, getAllBlogPostsAdmin);
  // app.get("/api/admin/blog/:id", authenticate, isAdmin, getBlogPostById);
  // app.put("/api/admin/blog/:id", authenticate, isAdmin, updateBlogPost);
  // app.delete("/api/admin/blog/:id", authenticate, isAdmin, deleteBlogPost);
}