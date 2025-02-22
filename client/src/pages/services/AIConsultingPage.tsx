import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, LineChart, Users, Cog, BadgeCheck, Gauge, Clock, DollarSign, Workflow, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceMetric {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface ServiceFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface Benefit {
  title: string;
  description: string;
}

interface Highlight {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function AIConsultingPage() {
  const metrics: ServiceMetric[] = [
    {
      value: "90%",
      label: "Cost Reduction",
      description: "Through AI-driven process optimization",
      icon: DollarSign
    },
    {
      value: "24/7",
      label: "AI Operations",
      description: "Continuous monitoring and optimization",
      icon: Clock
    },
    {
      value: "40%",
      label: "Efficiency Boost",
      description: "Average productivity increase with AI",
      icon: Gauge
    }
  ];

  const features: ServiceFeature[] = [
    {
      title: "Strategic AI Implementation",
      description: "Custom roadmaps for integrating AI into your business operations, ensuring maximum ROI and minimal disruption.",
      icon: BrainCircuit
    },
    {
      title: "Performance Analytics",
      description: "Real-time monitoring and optimization of AI systems to ensure peak performance and continuous improvement.",
      icon: LineChart
    },
    {
      title: "Team Enablement",
      description: "Comprehensive training and support to ensure your team can effectively leverage AI tools and systems.",
      icon: Users
    },
    {
      title: "Technical Excellence",
      description: "Expert guidance on AI architecture, security, and scalability to future-proof your systems.",
      icon: Cog
    }
  ];

  const benefits: Benefit[] = [
    {
      title: "Competitive Edge",
      description: "Stay ahead with cutting-edge AI solutions that give your business a significant market advantage."
    },
    {
      title: "Risk Mitigation",
      description: "Minimize implementation risks with expert guidance and proven methodologies."
    },
    {
      title: "Scalable Growth",
      description: "Build AI systems that grow with your business, ensuring long-term sustainability and success."
    },
    {
      title: "ROI Optimization",
      description: "Maximize return on AI investments through strategic planning and efficient implementation."
    }
  ];

  const includedServices = [
    {
      title: "AI Readiness Assessment",
      description: "Comprehensive evaluation of your current systems and processes for AI integration."
    },
    {
      title: "Strategic Planning",
      description: "Detailed roadmap development for AI implementation aligned with business goals."
    },
    {
      title: "Implementation Support",
      description: "Expert guidance throughout the AI integration process."
    },
    {
      title: "Performance Monitoring",
      description: "Continuous oversight and optimization of AI systems."
    },
    {
      title: "Training & Support",
      description: "Comprehensive team training and ongoing technical support."
    }
  ];

  const highlights: Highlight[] = [
    {
      icon: Workflow,
      title: "Streamlined Process",
      description: "Clear, step-by-step implementation with measurable milestones"
    },
    {
      icon: Sparkles,
      title: "Innovation Focus",
      description: "Stay ahead with cutting-edge AI advancements"
    },
    {
      icon: Zap,
      title: "Rapid Results",
      description: "Quick wins and long-term transformation"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-4xl mx-auto mb-16"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          AI Consulting & Future-Proofing
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Transform your business with expert AI guidance. Our consulting services help you navigate the AI landscape,
          ensuring your organization stays ahead of the curve and maximizes the benefits of AI technology.
        </p>

        {/* Highlights Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {highlights.map((highlight, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              className="p-6 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <highlight.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{highlight.title}</h3>
              <p className="text-muted-foreground">{highlight.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Metrics Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <Card key={index} className="border-0 hover:bg-accent/5 transition-all duration-300">
              <CardContent className="p-6">
                <metric.icon className="h-8 w-8 text-primary mb-4" />
                <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="font-semibold mb-2">{metric.label}</div>
                <p className="text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8 mb-16"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={fadeIn}>
              <Card className="h-full border-0 hover:bg-accent/5 transition-all duration-300">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.section 
          className="mb-16"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-3xl font-semibold text-center mb-12">Why Choose Our AI Consulting?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 hover:bg-accent/5 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="mb-16"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-3xl font-semibold text-center mb-12">What's Included?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {includedServices.map((service, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-1 transition-transform group-hover:scale-110" />
                <div>
                  <h3 className="font-semibold mb-1">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="text-center bg-primary/5 rounded-2xl p-12"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let's work together to build an AI strategy that drives your business forward. Our expert team is ready to guide you through every step of the journey.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/get-started">Get Started Now</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Schedule a Call</Link>
            </Button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}