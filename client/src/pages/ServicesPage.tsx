import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ServicesPage() {
  const services = [
    {
      title: "AI-Powered Assistant Integrations",
      description: "Revolutionize your customer interactions and operational efficiency with AI-driven virtual assistants integrated into your communication channels.",
      features: [
        "Phone Integration - Human-like AI voice assistants",
        "Email Automation - Automated inquiry handling",
        "Website Chatbot - Real-time visitor engagement",
        "Social Media Integration - Multi-platform management",
        "SMS/Text Messaging - Automated customer updates"
      ]
    },
    {
      title: "Comprehensive Efficiency Audit",
      description: "Unlock your business's full potential with our in-depth efficiency audit that analyzes your processes to uncover opportunities for AI-driven automation.",
      features: [
        "Business Process Analysis",
        "Technology Assessment",
        "Pain Point Identification",
        "Custom Solutions Report",
        "Implementation Roadmap"
      ]
    },
    {
      title: "Fleet Management System 2.0",
      description: "Optimize your vehicle operations with our AI-enhanced fleet management tools.",
      features: [
        "AI-Powered Problem Classification",
        "Repair Request Automation",
        "Dashboard Enhancements",
        "Cost Tracking",
        "Appointment Scheduling",
        "Driver Notifications"
      ]
    },
    {
      title: "Custom AI Solutions",
      description: "Have a unique business challenge? We develop tailored AI applications to meet your specific needs.",
      features: [
        "Inventory management systems",
        "Automated contracts and proposal generation",
        "Operational dashboards with real-time data",
        "Automated email content creation",
        "CRM enhancements"
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Our Services</h1>
        <p className="text-muted-foreground">
          Transform your business operations with our comprehensive suite of AI-powered solutions.
        </p>
      </div>

      <div className="grid gap-12">
        {services.map((service, index) => (
          <section key={index} className="space-y-6">
            <h2 className="text-3xl font-bold">{service.title}</h2>
            <p className="text-muted-foreground">{service.description}</p>
            <ul className="grid md:grid-cols-2 gap-4">
              {service.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Button asChild size="lg">
          <Link href="/contact">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
