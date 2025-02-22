import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, ClipboardCheck, TrendingUp } from "lucide-react";

type ServiceData = {
  title: string;
  description: string;
  includedFeatures: {
    title: string;
    description: string;
    icon: any;
  }[];
  process: {
    title: string;
    description: string;
  }[];
};

export default function AIEfficiencyAssessmentPage() {
  const service: ServiceData = {
    title: "AI Efficiency Assessment",
    description: "Identify automation opportunities and reduce business costs through our comprehensive AI-powered assessment. We analyze your operations to uncover efficiency gains and cost-saving opportunities.",
    includedFeatures: [
      {
        title: "Custom Efficiency Report",
        description: "A personalized breakdown of your business operations, highlighting areas of inefficiency and potential savings.",
        icon: FileText
      },
      {
        title: "Time & Cost Savings Calculator",
        description: "See exactly how many hours and dollars you're leaving on the table – and how to reclaim them.",
        icon: Clock
      },
      {
        title: "Actionable Recommendations",
        description: "Clear, practical steps to optimize your processes and start saving immediately.",
        icon: ClipboardCheck
      },
      {
        title: "Future Growth Insights",
        description: "Learn how automation and AI can help you scale, increase revenue, and improve customer satisfaction.",
        icon: TrendingUp
      }
    ],
    process: [
      {
        title: "Complete a Pre-Assessment Questionnaire",
        description: "Help us understand your business with a detailed questionnaire."
      },
      {
        title: "Schedule Your Free Consultation",
        description: "Book a 30-minute call to review your operations with our experts."
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <motion.div 
        className="max-w-3xl mx-auto mb-16"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {service.description}
        </p>
        <div className="flex gap-4 flex-wrap">
          <Button 
            variant="default"
            size="lg"
            className="text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all border border-primary/10"
            asChild
          >
            <Link to="/services/pre-assessment">Start Assessment →</Link>
          </Button>
        </div>
      </motion.div>

      {/* What's Included Section */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">What's Included in Your Assessment?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {service.includedFeatures.map((feature, index) => (
            <motion.div key={index} variants={fadeIn}>
              <Card className="h-full border-0 bg-background/40 hover:bg-background/60 transition-colors shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Process Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {service.process.map((step, index) => (
            <motion.div key={index} variants={fadeIn}>
              <Card className="h-full border-0 bg-background/40 hover:bg-background/60 transition-colors shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}