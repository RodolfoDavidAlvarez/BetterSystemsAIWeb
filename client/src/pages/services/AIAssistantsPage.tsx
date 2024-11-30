import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";

export default function AIAssistantsPage() {
  const service = {
    title: "AI-Powered Assistant Integrations",
    description: "Revolutionize your customer interactions and operational efficiency with AI-driven virtual assistants integrated into your communication channels.",
    features: [
      {
        title: "Phone Integration",
        description: "Human-like AI voice assistants for seamless customer support"
      },
      {
        title: "Email Automation",
        description: "Intelligent handling of customer inquiries and responses"
      },
      {
        title: "Website Chatbot",
        description: "Real-time visitor engagement and support"
      },
      {
        title: "Social Media Integration",
        description: "Automated multi-platform presence management"
      },
      {
        title: "SMS/Text Messaging",
        description: "Instant automated customer updates and notifications"
      }
    ],
    capabilities: [
      {
        title: "Natural Language Processing",
        description: "Understanding and responding to customer queries naturally"
      },
      {
        title: "24/7 Availability",
        description: "Round-the-clock customer support without interruption"
      },
      {
        title: "Multi-language Support",
        description: "Breaking language barriers for global accessibility"
      },
      {
        title: "Context Awareness",
        description: "Maintaining conversation context for better interactions"
      },
      {
        title: "Learning & Adaptation",
        description: "Continuous improvement from customer interactions"
      }
    ],
    benefits: [
      {
        title: "Reduced Operational Costs",
        description: "Lower customer service expenses through automation"
      },
      {
        title: "Increased Efficiency",
        description: "Faster response times and query resolution"
      },
      {
        title: "Enhanced Customer Experience",
        description: "Consistent and personalized service delivery"
      },
      {
        title: "Scalable Operations",
        description: "Handle multiple interactions simultaneously"
      },
      {
        title: "Data-Driven Insights",
        description: "Valuable customer interaction analytics"
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="max-w-3xl mx-auto mb-12">
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-6">{service.title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="grid gap-16">
        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {service.features.map((feature, index) => (
              <Card key={index} className="h-full">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {service.capabilities.map((capability, index) => (
              <Card key={index} className="h-full">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">{capability.title}</h3>
                  <p className="text-muted-foreground">{capability.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16 bg-primary/5 rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-8">Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {service.benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-2" />
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                </div>
                <p className="text-muted-foreground ml-5">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Transform Your Customer Service Today</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Ready to enhance your customer interactions? Our AI Assistants provide everything 
          you need to deliver exceptional service at scale.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/get-started">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/booking">Schedule Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
