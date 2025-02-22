import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { BrainCircuit, Mail, Globe, Phone, MessageSquare, Share2, LineChart, Users, Cog, BadgeCheck } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      title: "Business AI Consulting",
      subtitle: "Strategic AI implementation guidance",
      description: "Get expert guidance on integrating AI into your business operations. Our consultants help identify opportunities, develop implementation strategies, and ensure successful AI adoption across your organization.",
      benefits: [
        "AI readiness assessment",
        "Strategic implementation planning",
        "Technology stack recommendations",
        "ROI analysis and projections",
        "Change management support",
        "Training and enablement"
      ],
      integrations: [
        { icon: BrainCircuit, label: "Strategy" },
        { icon: LineChart, label: "Analytics" },
        { icon: Users, label: "Training" },
        { icon: Cog, label: "Implementation" },
        { icon: BadgeCheck, label: "Compliance" }
      ],
      href: "/services/ai-consulting",
      highlight: "Transform your business with expert AI guidance"
    },
    {
      title: "AI Assistants",
      subtitle: "For any business to implement",
      description: "AI assistants take over repetitive tasks so you don't have to. Each AI assistant is designed to handle a specific job with speed, accuracy, and efficiency—at a fraction of the cost of a human hire.",
      benefits: [
        "Internal business operations",
        "Capturing and managing leads", 
        "Following up with customers",
        "Billing and project cost estimation",
        "Educating or redirecting customers",
        "Automating any repetitive task"
      ],
      integrations: [
        { icon: Mail, label: "Email" },
        { icon: Globe, label: "Websites" },
        { icon: Phone, label: "Phone systems" },
        { icon: MessageSquare, label: "Text messaging" },
        { icon: Share2, label: "Social media" }
      ],
      href: "/services/ai-assistants",
      highlight: "Reduce labor costs by 90% while boosting productivity"
    },
    {
      title: "AI Efficiency Assessment",
      subtitle: "Identify automation opportunities & reduce business costs",
      description: "We conduct a comprehensive analysis of your business's systems, technology, processes, and structure to uncover opportunities for improvement. Our expert team provides a detailed report highlighting inefficiencies and offering actionable recommendations that could significantly reduce costs, enhance productivity, and unlock profit potential.",
      benefits: ["Process Analysis", "Cost Reduction Planning", "AI Implementation Strategy", "ROI Forecasting"],
      href: "/services/ai-efficiency-assessment",
      highlight: "Average 40% cost reduction identified"
    },
    {
      title: "Personalized Automation Solution",
      subtitle: "For unique business operations",
      description: "We understand that most businesses have tasks they repeat every day—whether administrative, operational, or necessary for scaling. These tasks don't directly generate revenue or improve quality but become more demanding as your business grows. That's where automation comes in. Our AI-driven solutions take over these repetitive processes, freeing up your time, cutting costs, and allowing you to focus on what truly matters.",
      benefits: [
        "Tailored automation for your business needs",
        "Seamless integration into your current systems",
        "Scalable solutions that grow with your business",
        "Ongoing support to ensure smooth operation"
      ],
      href: "/services/custom-solutions",
      highlight: "Achieve 200%+ ROI with average time saved of 2,500+ hours per automation"
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
            <div className="mb-4">
              <h2 className="text-3xl font-bold">{service.title}</h2>
              {service.subtitle && (
                <p className="text-lg text-muted-foreground mt-1">{service.subtitle}</p>
              )}
            </div>
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

            {service.integrations && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">It integrates with:</p>
                <div className="flex gap-4">
                  {service.integrations.map((integration, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <integration.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs">{integration.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6 text-primary">
              <BrainCircuit className="h-5 w-5" />
              <p className="font-semibold">{service.highlight}</p>
            </div>

            <div className="flex gap-4">
              <Button asChild className="group-hover:translate-x-1 transition-transform">
                <Link href={service.href}>Explore Service →</Link>
              </Button>
              <Button asChild variant="outline" className="group-hover:translate-x-1 transition-transform">
                <Link 
                  href={
                    service.title === "AI Efficiency Assessment" 
                      ? "/services/pre-assessment"
                      : "/get-started"
                  }
                >
                  {service.title === "AI Efficiency Assessment"
                    ? "Start Assessment" 
                    : "Request Solution"
                  }
                </Link>
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