import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import RootLayout from "./components/layout/RootLayout";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import AIAssistantsPage from "./pages/services/AIAssistantsPage";
import EfficiencyAuditPage from "./pages/services/EfficiencyAuditPage";
import FleetManagementPage from "./pages/services/FleetManagementPage";
import CustomSolutionsPage from "./pages/services/CustomSolutionsPage";
import AboutPage from "./pages/AboutPage";
import PartnersPage from "./pages/PartnersPage";
import ContactPage from "./pages/ContactPage";
import Booking from "./components/sections/Booking";
import SocialPage from "./pages/SocialPage";
import PhotoSubmissionPage from "./pages/PhotoSubmissionPage";
import GetStartedPage from "./pages/GetStartedPage";
import { useScrollToTop } from './hooks/useScrollToTop';
import PageTransition from "./components/layout/PageTransition";

const Router = () => {
  useScrollToTop();
  
  return (
    <RootLayout>
      <PageTransition>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/services/ai-assistants" component={AIAssistantsPage} />
          <Route path="/services/efficiency-audit" component={EfficiencyAuditPage} />
          <Route path="/services/fleet-management" component={FleetManagementPage} />
          <Route path="/services/custom-solutions" component={CustomSolutionsPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/partners" component={PartnersPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/booking" component={Booking} />
          <Route path="/social" component={SocialPage} />
          <Route path="/photo-submission" component={PhotoSubmissionPage} />
          <Route path="/get-started" component={GetStartedPage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </PageTransition>
    </RootLayout>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

let root: ReturnType<typeof createRoot>;
if (!(rootElement as any).__react_root) {
  root = createRoot(rootElement);
  (rootElement as any).__react_root = root;
} else {
  root = (rootElement as any).__react_root;
}

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
);
