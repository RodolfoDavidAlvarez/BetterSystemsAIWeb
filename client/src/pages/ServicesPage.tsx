import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { BrainCircuit } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      title: "AI-Powered Assistant Integrations",
      description: "Transform your customer experience with intelligent virtual assistants that operate 24/7 across all channels. Our AI assistants leverage cutting-edge natural language processing to understand context, emotions, and intent, delivering personalized interactions that boost efficiency by up to 70% while maintaining a human touch.",
      benefits: ["24/7 Multi-channel Support", "Natural Language Understanding", "Seamless System Integration", "70% Efficiency Boost"],
      href: "/services/ai-assistants",
      highlight: "Reduce response times by 90% while improving satisfaction"
    },
    {
      title: "Business Efficiency and Profit Maximization Audit",
      description: "We conduct a comprehensive analysis of your business's systems, technology, processes, and structure to uncover opportunities for improvement. Our expert team provides a detailed report highlighting inefficiencies and offering actionable recommendations that could significantly reduce costs, enhance productivity, and unlock profit potential.",
      benefits: ["Process Analysis", "Cost Reduction Planning", "AI Implementation Strategy", "ROI Forecasting"],
      href: "/services/efficiency-audit",
      highlight: "Average 40% cost reduction identified"
    },
    {
      title: "Fleet Management System 2.0",
      description: "Revolutionary AI-enhanced fleet management that transforms how you monitor, maintain, and optimize your vehicle operations. From predictive maintenance to real-time route optimization, take control of your fleet like never before.",
      benefits: ["Real-time Monitoring", "Predictive Maintenance", "Route Optimization", "Cost Analytics"],
      href: "/services/fleet-management",
      highlight: "Reduce fleet costs by up to 35%"
    },
    {
      title: "Request Your Custom Business Solution",
      description: "Face unique business challenges? Our team of AI experts develops tailored solutions that address your specific needs. From automated workflows to intelligent decision support systems, we turn your vision into reality.",
      benefits: ["Customized Development", "Seamless Integration", "Scalable Solutions", "Ongoing Support"],
      href: "/services/custom-solutions",
      highlight: "Achieve 200% ROI on custom solutions"
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
            className="group relative overflow-hidden rounded-xl p-8 transition-all duration-300 hover:bg-primary/5 hover:shadow-lg"
            variants={fadeIn}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-3xl font-bold mb-4">{service.title}</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {service.benefits.map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-6 text-primary">
              <BrainCircuit className="h-5 w-5" />
              <p className="font-semibold">{service.highlight}</p>
            </div>

            <div className="flex gap-4">
              <Button asChild className="group-hover:translate-x-1 transition-transform">
                <Link href={service.href}>Explore Service →</Link>
              </Button>
              <Button asChild variant="outline" className="group-hover:translate-x-1 transition-transform">
                <Link href="/get-started">Request Solution</Link>
              </Button>
            </div>
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
