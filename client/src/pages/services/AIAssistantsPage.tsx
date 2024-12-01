import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AIAssistantsPage() {
  const service = {
    title: "AI-Powered Assistant Integrations",
    description: "Revolutionize your customer interactions and operational efficiency with AI-driven virtual assistants integrated into your communication channels.",
    channels: [
      {
        title: "Phone Integration",
        description: "Human-like AI voice assistants that handle calls 24/7, understand context, and seamlessly transfer to human agents when needed.",
        capabilities: [
          "Natural language processing for human-like conversations",
          "Intelligent call routing and prioritization",
          "Multilingual support for global operations",
          "Call transcription and analytics"
        ]
      },
      {
        title: "Email Automation",
        description: "Smart email processing system that understands, categorizes, and responds to inquiries automatically.",
        capabilities: [
          "Intelligent email classification and routing",
          "Automated response generation",
          "Attachment and document processing",
          "Priority inbox management"
        ]
      },
      {
        title: "Website Chatbot",
        description: "Interactive chat interface that engages visitors, answers questions, and guides them through your services.",
        capabilities: [
          "Real-time visitor engagement",
          "Product recommendations",
          "FAQ automation",
          "Lead qualification"
        ]
      },
      {
        title: "Social Media Integration",
        description: "Unified social media management with AI-powered responses and engagement tracking.",
        capabilities: [
          "Multi-platform message management",
          "Automated content moderation",
          "Sentiment analysis",
          "Engagement analytics"
        ]
      },
      {
        title: "SMS/Text Messaging",
        description: "Automated messaging system for updates, reminders, and two-way communication.",
        capabilities: [
          "Automated appointment reminders",
          "Order status updates",
          "Two-way conversation handling",
          "Campaign management"
        ]
      }
    ],
    benefits: [
      {
        title: "24/7 Availability",
        description: "Provide round-the-clock support without increasing operational costs"
      },
      {
        title: "Increased Efficiency",
        description: "Handle thousands of interactions simultaneously while maintaining quality"
      },
      {
        title: "Cost Reduction",
        description: "Reduce operational costs by up to 70% through automation"
      },
      {
        title: "Better Customer Experience",
        description: "Instant responses and consistent service across all channels"
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto mb-12">
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
        <p className="text-muted-foreground text-lg mb-8">
          {service.description}
        </p>
      </div>

      <section className="space-y-12 mb-16">
        <h2 className="text-3xl font-semibold">Channel Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {service.channels.map((channel, index) => (
            <div key={index} className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">{channel.title}</h3>
              <p className="text-muted-foreground mb-4">{channel.description}</p>
              <ul className="space-y-2">
                {channel.capabilities.map((capability, capIndex) => (
                  <li key={capIndex} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {capability}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8 mb-16">
        <h2 className="text-3xl font-semibold">Business Benefits</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {service.benefits.map((benefit, index) => (
            <div key={index} className="bg-muted p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 text-center">
        <Button asChild size="lg">
          <Link href="/get-started">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
