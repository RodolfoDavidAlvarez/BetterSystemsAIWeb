import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AIAssistantsPage() {
  const service = {
    title: "AI-Powered Assistant Integrations",
    description: "Revolutionize your customer interactions and operational efficiency with AI-driven virtual assistants integrated into your communication channels.",
    features: [
      "Phone Integration - Human-like AI voice assistants",
      "Email Automation - Automated inquiry handling",
      "Website Chatbot - Real-time visitor engagement",
      "Social Media Integration - Multi-platform management",
      "SMS/Text Messaging - Automated customer updates"
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto mb-12">
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
        <p className="text-muted-foreground text-lg">
          {service.description}
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Key Features</h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {service.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 text-center">
        <Link href="/contact">
          <Button size="lg">Get Started</Button>
        </Link>
      </div>
    </div>
  );
}
