// React imports
import { Router, Route, Switch } from "wouter";
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
import PartnersPage from "./pages/PartnersPage";
import SocialPage from "./pages/SocialPage";
import { useScrollToTop } from "./hooks/useScrollToTop";

// Admin imports
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import BlogPostsPage from "./pages/admin/BlogPostsPage";
import BlogPostEditor from "./pages/admin/BlogPostEditor";
import ClientsPage from "./pages/admin/ClientsPage";
import ClientEditorPage from "./pages/admin/ClientEditorPage";
import BillingPage from "./pages/admin/BillingPage";
import DealsPage from "./pages/admin/DealsPage";
import DealDetailPage from "./pages/admin/DealDetailPage";
import TicketsPage from "./pages/admin/TicketsPage";
import ChangelogPage from "./pages/admin/ChangelogPage";
import UpdatesPage from "./pages/admin/UpdatesPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";

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
              <Route path="/rodolfo" component={SocialPage} />

              {/* Admin Routes */}
              <Route path="/admin/login" component={LoginPage} />
              <Route path="/admin/dashboard">
                <ProtectedRoute>
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/blog">
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogPostsPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/blog/new">
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogPostEditor />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/blog/:id">
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogPostEditor />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* CRM Routes */}
              <Route path="/admin/clients">
                <ProtectedRoute>
                  <AdminLayout>
                    <ClientsPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/clients/new">
                <ProtectedRoute>
                  <AdminLayout>
                    <ClientEditorPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/clients/:id/edit">
                <ProtectedRoute>
                  <AdminLayout>
                    <ClientEditorPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/clients/:id">
                <ProtectedRoute>
                  <AdminLayout>
                    <ClientEditorPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
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
              <Route path="/admin/billing">
                <ProtectedRoute>
                  <AdminLayout>
                    <BillingPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/tickets">
                <ProtectedRoute>
                  <AdminLayout>
                    <TicketsPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/changelogs">
                <ProtectedRoute>
                  <AdminLayout>
                    <ChangelogPage />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/updates">
                <ProtectedRoute>
                  <AdminLayout>
                    <UpdatesPage />
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
