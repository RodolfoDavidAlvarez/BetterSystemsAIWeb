
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
import { useScrollToTop } from './hooks/useScrollToTop';
import OperationsPlanPage from "./pages/admin/OperationsPlanPage";

// Admin imports
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import BlogPostsPage from "./pages/admin/BlogPostsPage";
import BlogPostEditor from "./pages/admin/BlogPostEditor";
import ClientsPage from "./pages/admin/ClientsPage";
import ClientEditorPage from "./pages/admin/ClientEditorPage";
import ProjectsPage from "./pages/admin/ProjectsPage";
import ProjectDetailPage from "./pages/admin/ProjectDetailPage";
import ProjectEditorPage from "./pages/admin/ProjectEditorPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
                <DashboardPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/blog">
              <ProtectedRoute>
                <BlogPostsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/blog/new">
              <ProtectedRoute>
                <BlogPostEditor />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/blog/:id">
              {(params) => (
                <ProtectedRoute>
                  <BlogPostEditor postId={params.id} />
                </ProtectedRoute>
              )}
            </Route>

            {/* CRM Routes */}
            <Route path="/admin/clients">
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/clients/new">
              <ProtectedRoute>
                <ClientEditorPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/clients/:id/edit">
              <ProtectedRoute>
                <ClientEditorPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/clients/:id">
              <ProtectedRoute>
                <ClientEditorPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/projects">
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/projects/new">
              <ProtectedRoute>
                <ProjectEditorPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/projects/:id/edit">
              <ProtectedRoute>
                <ProjectEditorPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/projects/:id">
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/plan">
              <ProtectedRoute>
                <OperationsPlanPage />
              </ProtectedRoute>
            </Route>

            {/* 404 Route */}
            <Route>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                  <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
                  <a href="/" className="text-primary hover:underline">Go back home</a>
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
