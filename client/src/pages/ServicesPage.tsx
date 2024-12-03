import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";

export default function ServicesPage() {
  const services = [
    {
      title: "AI-Powered Assistant Integrations",
      description: "Revolutionize your customer interactions and operational efficiency with AI-driven virtual assistants integrated into your communication channels.",
      href: "/services/ai-assistants"
    },
    {
      title: "Comprehensive Efficiency Audit",
      description: "Unlock your business's full potential with our in-depth efficiency audit that analyzes your processes to uncover opportunities for AI-driven automation.",
      href: "/services/efficiency-audit"
    },
    {
      title: "Fleet Management System 2.0",
      description: "Optimize your vehicle operations with our AI-enhanced fleet management tools.",
      href: "/services/fleet-management"
    },
    {
      title: "Custom AI Solutions",
      description: "Have a unique business challenge? We develop tailored AI applications to meet your specific needs.",
      href: "/services/custom-solutions"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-3xl mx-auto mb-12 text-center"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <h1 className="text-4xl font-bold mb-4">Our Services</h1>
        <p className="text-muted-foreground">
          Transform your business operations with our comprehensive suite of AI-powered solutions.
        </p>
      </motion.div>

      <motion.div 
        className="grid gap-8"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        {services.map((service, index) => (
          <motion.section 
            key={index} 
            className="group hover:bg-primary/5 rounded-lg p-8 transition-colors"
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold mb-4">{service.title}</h2>
            <p className="text-muted-foreground mb-6">{service.description}</p>
            <Button asChild>
              <Link href={service.href}>Learn More →</Link>
            </Button>
          </motion.section>
        ))}
      </motion.div>

      <div className="mt-16 text-center">
        <Button asChild size="lg">
          <Link href="/contact">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
