import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, LineChart, Users, Cog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface Benefit {
  title: string;
  description: string;
}

export default function AIConsultingPage() {
  const features: ServiceFeature[] = [
    {
      title: "Predict & Adapt to AI Trends",
      description: "Stay ahead of the curve with continuous guidance, industry insights, and proactive AI strategies.",
      icon: BrainCircuit
    },
    {
      title: "Optimize Business Operations",
      description: "Transform your operations with AI-driven solutions that enhance efficiency and scalability.",
      icon: LineChart
    },
    {
      title: "Long-Term Strategy Development",
      description: "Get expert guidance on AI implementation and future-proofing your business.",
      icon: Users
    },
    {
      title: "Technical Implementation",
      description: "Seamless integration of AI solutions with step-by-step guidance for sustainable growth.",
      icon: Cog
    }
  ];

  const benefits: Benefit[] = [
    {
      title: "Ongoing AI Guidance",
      description: "Get continuous access to AI experts who analyze trends and recommend strategic improvements."
    },
    {
      title: "Proactive AI Updates",
      description: "Be the first to know about new AI tools, breakthroughs, and automation advancements relevant to your industry."
    },
    {
      title: "Customized AI Strategies",
      description: "Tailored AI roadmaps designed to enhance your operations, efficiency, and scalability."
    },
    {
      title: "Long-Term Competitive Advantage",
      description: "AI isn't just about keeping up—it's about leading. Stay ahead with future-proof AI implementation."
    }
  ];

  const includedServices = [
    {
      title: "AI Strategy Assessment",
      description: "We evaluate your current AI adoption and identify opportunities for improvement."
    },
    {
      title: "Quarterly Optimization Reviews",
      description: "Regular evaluations of your AI solutions to ensure maximum efficiency."
    },
    {
      title: "Industry Trends & Alerts",
      description: "Curated reports on the latest AI advancements and how they impact your business."
    },
    {
      title: "Exclusive AI Consultation",
      description: "Priority access to expert strategists for personalized AI advice."
    },
    {
      title: "Implementation Roadmap",
      description: "Step-by-step guidance on integrating AI into your workflow for sustainable growth."
    }
  ];

  const targetAudience = [
    "Business leaders looking to leverage AI for operational efficiency",
    "Companies that want to stay competitive in an AI-driven market",
    "Organizations in need of custom AI strategies without the guesswork"
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
        <h1 className="text-4xl font-bold mb-4">AI Consulting & Future-Proofing</h1>
        <p className="text-lg text-muted-foreground mb-8">
          AI is evolving fast—will your business keep up? Our AI Consulting & Future-Proofing service ensures you stay ahead of the curve with continuous guidance, industry insights, and proactive AI strategies tailored to your business needs.
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
          <motion.div key={index} variants={fadeIn}>
            <Card className="h-full">
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
        <h2 className="text-3xl font-bold mb-8">Why Choose AI Consulting & Future-Proofing?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="h-full">
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
        <h2 className="text-3xl font-bold mb-8">What's Included?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {includedServices.map((service, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
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
        <h2 className="text-3xl font-bold mb-8">Who Is This For?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {targetAudience.map((audience, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                <p className="text-lg">{audience}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="text-center bg-primary/5 rounded-2xl p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-4">Transform Your Business with AI Expertise</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          AI is reshaping the business world—don't get left behind. With Better Systems AI, you have a dedicated AI partner that ensures your business is always a step ahead.
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
    </div>
  );
}