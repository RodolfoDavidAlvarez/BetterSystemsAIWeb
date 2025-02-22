
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, LineChart, Users, Cog, CheckCircle2 } from "lucide-react";
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
  position?: string;
  company?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function AIConsultingPage() {
  const features: ServiceFeature[] = [
    {
      title: "Strategic AI Planning",
      description: "Custom roadmap development for integrating AI into your business operations",
      icon: BrainCircuit
    },
    {
      title: "Performance Analytics",
      description: "Data-driven insights to measure and optimize AI implementation impact",
      icon: LineChart
    },
    {
      title: "Team Training",
      description: "Comprehensive training programs to ensure successful AI adoption",
      icon: Users
    },
    {
      title: "Technical Integration",
      description: "Seamless implementation of AI solutions into existing systems",
      icon: Cog
    }
  ];

  const processSteps: ProcessStep[] = [
    {
      title: "Initial Assessment",
      description: "We evaluate your current operations, challenges, and goals to identify AI opportunities"
    },
    {
      title: "Strategy Development",
      description: "Creating a tailored AI implementation plan aligned with your business objectives"
    },
    {
      title: "Implementation Planning",
      description: "Detailed execution roadmap including technology selection and timeline"
    },
    {
      title: "Training & Support",
      description: "Comprehensive team training and ongoing support for successful adoption"
    }
  ];

  const testimonials: Testimonial[] = [
    {
      quote: "The consulting team helped us identify and implement AI solutions that transformed our operations and improved efficiency by 40%.",
      author: "Michael Chen",
      position: "CTO",
      company: "TechCorp Solutions"
    }
  ];

  const faqs: FAQ[] = [
    {
      question: "How long does the consulting process take?",
      answer: "The timeline varies based on your needs and project scope, typically ranging from 4-12 weeks for initial assessment and strategy development."
    },
    {
      question: "What industries do you work with?",
      answer: "We have experience across multiple industries including manufacturing, healthcare, retail, and professional services."
    },
    {
      question: "How do you measure success?",
      answer: "We establish clear KPIs at the start of the engagement and track metrics like cost reduction, efficiency improvements, and ROI throughout the implementation."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-3xl mx-auto mb-16"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">AI Consulting Services</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Transform your business operations with expert AI guidance. Our consulting services help you navigate the AI landscape, develop strategic implementation plans, and ensure successful adoption of AI technologies.
        </p>
        <div className="flex gap-4 flex-wrap">
          <Button size="lg" asChild>
            <Link href="/get-started">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">Schedule Consultation</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div 
        className="grid md:grid-cols-2 gap-8 mb-16"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        {features.map((feature, index) => (
          <Card key={index} className="p-6">
            <CardContent className="p-0">
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div 
        className="mb-16"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Our Process</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {processSteps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">{index + 1}</span>
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        className="mb-16"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Client Success Stories</h2>
        <div className="max-w-2xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="text-center">
              <p className="text-lg mb-4 italic">"{testimonial.quote}"</p>
              <p className="font-semibold">{testimonial.author}</p>
              {testimonial.position && testimonial.company && (
                <p className="text-muted-foreground">{testimonial.position}, {testimonial.company}</p>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
