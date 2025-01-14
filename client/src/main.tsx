import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
// Force CSS injection
import "tailwindcss/tailwind.css";
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
import GetStartedPage from "./pages/GetStartedPage";
import BusinessImpactPage from "./pages/BusinessImpactPage";
import PreAssessmentQuestionnairePage from "./pages/services/PreAssessmentQuestionnairePage";
import { useScrollToTop } from './hooks/useScrollToTop';

function Router() {
  useScrollToTop();

  return (
    <RootLayout>
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
        <Route path="/founders-social" component={SocialPage} />
        <Route path="/get-started" component={GetStartedPage} />
        <Route path="/business-impact" component={BusinessImpactPage} />
        <Route path="/services/pre-assessment" component={PreAssessmentQuestionnairePage} />
        <Route>404 Page Not Found</Route>
      </Switch>
    </RootLayout>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);