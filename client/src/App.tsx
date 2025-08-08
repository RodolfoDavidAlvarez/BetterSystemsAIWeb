
// React imports
import { Router, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import SocialPage from "./pages/SocialPage";
import GetStartedPage from "./pages/GetStartedPage";
import AIWorkflowAssessmentPage from "./pages/AIWorkflowAssessmentPage";
import PreAssessmentQuestionnairePage from "./pages/services/PreAssessmentQuestionnairePage";
import AIConsultingPage from "./pages/services/AIConsultingPage";
import AIPersonalAssistantTutorialPage from "./pages/services/AIPersonalAssistantTutorialPage";
import BuildWebsiteWithAIPage from "./pages/learn/BuildWebsiteWithAIPage";
import LearnPage from "./pages/LearnPage";
import { useScrollToTop } from './hooks/useScrollToTop';

function App() {
  useScrollToTop();

  return (
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
        <Router>
          <RootLayout>
            <Switch>
            {/* Public Routes */}
            <Route path="/" component={HomePage} />
            <Route path="/services" component={ServicesPage} />
            <Route path="/services/ai-assistants" component={AIAssistantsPage} />
            <Route path="/services/ai-efficiency-assessment" component={EfficiencyAuditPage} />
            <Route path="/services/fleet-management" component={FleetManagementPage} />
            <Route path="/services/custom-solutions" component={CustomSolutionsPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/partners" component={PartnersPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/founders-social" component={SocialPage} />
            <Route path="/get-started" component={GetStartedPage} />

            <Route path="/services/pre-assessment" component={PreAssessmentQuestionnairePage} />
            <Route path="/services/ai-consulting" component={AIConsultingPage} />
            <Route path="/services/ai-assistants/personal-assistant-tutorial" component={AIPersonalAssistantTutorialPage} />
            <Route path="/ai-workflow-assessment" component={AIWorkflowAssessmentPage} />
            <Route path="/learn" component={LearnPage} />
            <Route path="/learn/build-website-with-ai" component={BuildWebsiteWithAIPage} />
            
            {/* 404 Route */}
            <Route>404 Page Not Found</Route>
          </Switch>
          <Toaster />
        </RootLayout>
      </Router>
    </QueryClientProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
