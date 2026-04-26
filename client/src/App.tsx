// React imports
import { useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import RootLayout from "./components/layout/RootLayout";

import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LearnPage from "./pages/LearnPage";
import ClientOnboardingPage from "./pages/ClientOnboardingPage";
import OnboardPage from "./pages/OnboardPage";
import PartnersPage from "./pages/PartnersPage";
import SocialPage from "./pages/SocialPage";
import BookingPage from "./pages/BookingPage";
import ContractorCRMPage from "./pages/ContractorCRMPage";
import InvoicePaymentPage from "./pages/InvoicePaymentPage";
import AIPresentationPage from "./pages/AIPresentationPage";
import { useScrollToTop } from "./hooks/useScrollToTop";

// Admin imports
import LoginPage from "./pages/admin/LoginPage";
import BillingPage from "./pages/admin/BillingPage";
import ConversationsPage from "./pages/admin/ConversationsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import ReviewSurveyPage from "./pages/ReviewSurveyPage";
import OutreachDashboard from "./pages/admin/OutreachDashboard";
import RecordingSearchPage from "./pages/admin/RecordingSearchPage";
import MorePage from "./pages/admin/MorePage";
import DealsPage from "./pages/admin/DealsPage";
import DealDetailPage from "./pages/admin/DealDetailPage";
import TasksPage from "./pages/admin/TasksPage";
import DevTrackerPage from "./pages/admin/DevTrackerPage";
import WorkspacePage from "./pages/admin/WorkspacePage";

// Simple redirect component that doesn't cause infinite re-renders
function RedirectTo({ path }: { path: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(path, { replace: true });
  }, [navigate, path]);
  return null;
}


function App() {
  useScrollToTop();

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <RootLayout>
            <Switch>
              {/* Core Pages */}
              <Route path="/" component={HomePage} />
              <Route path="/services" component={ServicesPage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/learn" component={LearnPage} />
              <Route path="/contact" component={ContactPage} />
              <Route path="/partners" component={PartnersPage} />
              <Route path="/client-onboarding" component={ClientOnboardingPage} />
              <Route path="/onboard" component={OnboardPage} />
              <Route path="/start" component={OnboardPage} />
              <Route path="/rodolfo" component={SocialPage} />
              <Route path="/book" component={BookingPage} />
              <Route path="/contractors" component={ContractorCRMPage} />
              <Route path="/review" component={ReviewSurveyPage} />
              <Route path="/pay/:invoiceNumber" component={InvoicePaymentPage} />
              <Route path="/ai-presentation" component={AIPresentationPage} />

              {/* Admin Routes */}
              <Route path="/admin/login" component={LoginPage} />

              {/* Redirect old routes to conversations */}
              <Route path="/admin/dashboard">
                <RedirectTo path="/admin/conversations" />
              </Route>

              {/* Conversations — the main admin page */}
              <Route path="/admin/conversations">
                <ProtectedRoute>
                  <AdminLayout>
                    <ConversationsPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* Outreach CRM */}
              <Route path="/admin/outreach">
                <ProtectedRoute>
                  <AdminLayout>
                    <OutreachDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* Deals Pipeline */}
              <Route path="/admin/deals/:id">
                <ProtectedRoute>
                  <AdminLayout>
                    <DealDetailPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              <Route path="/admin/deals">
                <ProtectedRoute>
                  <AdminLayout>
                    <DealsPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* Recording Intelligence */}
              <Route path="/admin/search">
                <ProtectedRoute>
                  <AdminLayout>
                    <RecordingSearchPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* Tasks — Task Management & Agent Progress */}
              <Route path="/admin/tasks">
                <ProtectedRoute>
                  <AdminLayout>
                    <TasksPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* Dev Tracker — role-gated project tracker (owner + developer + admin) */}
              <Route path="/admin/dev-tracker">
                <ProtectedRoute requiredRole={["owner", "developer", "admin"]}>
                  <DevTrackerPage />
                </ProtectedRoute>
              </Route>

              {/* Workspace — operational landing for devs and admins */}
              <Route path="/workspace">
                <ProtectedRoute requiredRole={["owner", "developer", "admin"]}>
                  <WorkspacePage />
                </ProtectedRoute>
              </Route>

              {/* More — Speaker Profiles & Intelligence */}
              <Route path="/admin/more">
                <ProtectedRoute>
                  <AdminLayout>
                    <MorePage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* Financial — kept as-is */}
              <Route path="/admin/billing">
                <ProtectedRoute>
                  <AdminLayout>
                    <BillingPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* 404 Route */}
              <Route>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
                    <a href="/" className="text-primary hover:underline">
                      Go back home
                    </a>
                  </div>
                </div>
              </Route>
            </Switch>
            <Toaster />
          </RootLayout>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
