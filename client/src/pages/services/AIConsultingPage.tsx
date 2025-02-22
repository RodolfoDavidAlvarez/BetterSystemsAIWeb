
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, LineChart, Users, Cog, BadgeCheck, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ProcessStep {
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  author: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ServiceData {
  title: string;
  description: string;
  includedFeatures: ServiceFeature[];
  whyChooseUs: string[];
  process: ProcessStep[];
  testimonials: Testimonial[];
  faqs: FAQ[];
}

export default function AIConsultingPage() {
  const service: ServiceData = {
    title: "Business AI Consulting",
    description: "Transform your business operations with expert AI guidance. Our consulting services help you navigate the AI landscape, develop strategic implementation plans, and ensure successful adoption of AI technologies.",
    includedFeatures: [
      {
        title: "AI Readiness Assessment",
        description: "Comprehensive evaluation of your organization's AI readiness and opportunities for implementation.",
        icon: BrainCircuit
      },
      {
        title: "Strategic Planning",
        description: "Detailed roadmap for AI integration, including technology selection and implementation timeline.",
        icon: LineChart
      },
      {
        title: "Training Programs",
        description: "Custom training solutions to prepare your team for AI adoption and usage.",
        icon: Users
      },
      {
        title: "Implementation Support",
        description: "Expert guidance throughout the implementation process to ensure successful deployment.",
        icon: Cog
      }
    ],
    whyChooseUs: [
      "Proven expertise in successful AI implementations across various industries",
      "Customized solutions tailored to your specific business needs",
      "Comprehensive support from strategy to implementation",
      "Focus on measurable ROI and business impact"
    ],
    process: [
      {
        title: "Initial Assessment",
        description: "We evaluate your current operations and identify AI opportunities."
      },
      {
        title: "Strategy Development",
        description: "Creating a customized AI implementation plan aligned with your goals."
      },
      {
        title: "Implementation Planning",
        description: "Detailed execution strategy including technology selection and timeline."
      },
      {
        title: "Training & Support",
        description: "Comprehensive training and ongoing support for successful adoption."
      }
    ],
    testimonials: [
      {
        quote: "The consulting team helped us navigate the complex world of AI and implement solutions that truly impacted our bottom line.",
        author: "John Smith, CEO"
      }
    ],
    faqs: [
      {
        question: "How long does the consulting process take?",
        answer: "The timeline varies based on your needs, typically ranging from 4-12 weeks for initial assessment and strategy development."
      },
      {
        question: "What industries do you work with?",
        answer: "We have experience across multiple industries including manufacturing, healthcare, retail, and professional services."
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="space-y-16"
      >
        <motion.header variants={fadeIn} className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">{service.title}</h1>
          <p className="text-xl text-muted-foreground">{service.description}</p>
        </motion.header>

        <motion.section variants={fadeIn} className="grid md:grid-cols-2 gap-8">
          {service.includedFeatures.map((feature, index) => (
            <Card key={index} className="group">
              <CardContent className="p-6">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.section>

        <motion.section variants={fadeIn} className="text-center">
          <Button asChild size="lg">
            <Link href="/contact">Schedule Consultation</Link>
          </Button>
        </motion.section>
      </motion.div>
    </div>
  );
}
