import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function CustomSolutionsPage() {
  const service = {
    title: "Personalized Automation Solution",
    description: "We develop tailored AI applications to meet your specific business needs, automating complex processes and enhancing operational efficiency.",
    features: [
      "Inventory management systems",
      "Automated contracts and proposal generation",
      "Operational dashboards with real-time data",
      "Automated email content creation",
      "CRM enhancements"
    ]
  };

  const caseStudies = [
    {
      title: "Fleet Management System 2.0",
      company: "Agave Environmental Contract, Inc",
      description: "One of Arizona's largest landscape companies transformed their fleet operations with our custom AI solution, achieving 35% cost reduction and 90% efficiency improvement.",
      metric: "35%",
      metricLabel: "Cost Reduction",
      image: "/images/fleet-management-preview.png",
      link: "/services/fleet-management",
      highlights: [
        "AI-powered problem classification",
        "Real-time communication system",
        "Comprehensive analytics dashboard",
        "Automated maintenance scheduling"
      ]
    }
    // Add more case studies here as needed
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
        <p className="text-muted-foreground text-lg">
          {service.description}
        </p>
      </motion.div>

      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-2xl font-semibold mb-8">Key Features</h2>
        <ul className="grid md:grid-cols-2 gap-4 mb-16">
          {service.features.map((feature, index) => (
            <motion.li 
              key={index} 
              className="flex items-center gap-2"
              variants={fadeIn}
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {feature}
            </motion.li>
          ))}
        </ul>

        {/* Success Stories Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Success Stories</h2>
          <div className="grid gap-8">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="group"
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-0">
                  <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <h3 className="text-2xl font-semibold mb-2">{study.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{study.company}</p>
                        <p className="text-muted-foreground mb-6">{study.description}</p>
                        <ul className="space-y-2 mb-6">
                          {study.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <span className="size-1.5 rounded-full bg-primary/60" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                        <Button asChild variant="ghost" className="group-hover:translate-x-1 transition-transform">
                          <Link href={study.link}>
                            View Full Case Study
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">{study.metric}</div>
                          <div className="text-sm text-muted-foreground">{study.metricLabel}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.div 
        className="text-center bg-primary/5 rounded-2xl p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Let's discuss how we can create a custom AI solution that addresses your unique business challenges and drives real results.
        </p>
        <Button asChild size="lg">
          <Link href="/get-started">Request Solution</Link>
        </Button>
      </motion.div>
    </div>
  );
}