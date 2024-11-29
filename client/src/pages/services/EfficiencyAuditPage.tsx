import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function EfficiencyAuditPage() {
  const service = {
    title: "Comprehensive Efficiency Audit",
    description: "Unlock your business's full potential with our in-depth efficiency audit that analyzes your processes to uncover opportunities for AI-driven automation.",
    features: [
      "Business Process Analysis",
      "Technology Assessment",
      "Pain Point Identification",
      "Custom Solutions Report",
      "Implementation Roadmap"
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
