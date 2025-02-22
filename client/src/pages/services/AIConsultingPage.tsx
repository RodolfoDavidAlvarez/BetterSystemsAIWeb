
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, LineChart, Users, Cog, Zap, BarChart3, Target, TrendingUp, AlertCircle, MessageCircle, ClipboardList, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface Benefit {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface Service {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function AIConsultingPage() {
  const benefits: Benefit[] = [
    {
      title: "Ongoing AI Guidance",
      description: "Get continuous access to AI experts who analyze trends and recommend strategic improvements.",
      icon: MessageCircle
    },
    {
      title: "Proactive AI Updates",
      description: "Be the first to know about new AI tools, breakthroughs, and automation advancements relevant to your industry.",
      icon: AlertCircle
    },
    {
      title: "Customized AI Strategies",
      description: "Tailored AI roadmaps designed to enhance your operations, efficiency, and scalability.",
      icon: Target
    },
    {
      title: "Long-Term Competitive Advantage",
      description: "AI isn't just about keeping up—it's about leading. Stay ahead with future-proof AI implementation.",
      icon: TrendingUp
    }
  ];

  const services: Service[] = [
    {
      title: "AI Strategy Assessment",
      description: "We evaluate your current AI adoption and identify opportunities for improvement.",
      icon: BrainCircuit
    },
    {
      title: "Quarterly Optimization Reviews",
      description: "Regular evaluations of your AI solutions to ensure maximum efficiency.",
      icon: BarChart3
    },
    {
      title: "Industry Trends & Alerts",
      description: "Curated reports on the latest AI advancements and how they impact your business.",
      icon: Zap
    },
    {
      title: "Exclusive AI Consultation",
      description: "Priority access to expert strategists for personalized AI advice.",
      icon: Users
    },
    {
      title: "Implementation Roadmap",
      description: "Step-by-step guidance on integrating AI into your workflow for sustainable growth.",
      icon: ClipboardList
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        initial="initial"
        animate="animate"
        variants={fadeIn}
        className="max-w-4xl mx-auto"
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">AI Consulting & Future-Proofing</h1>
          <p className="text-2xl text-muted-foreground mb-6">Stay Ahead with AI-Driven Innovation</p>
          <p className="text-lg text-muted-foreground mb-8">
            AI is evolving fast—will your business keep up? Our AI Consulting & Future-Proofing service ensures you stay ahead of the curve with continuous guidance, industry insights, and proactive AI strategies tailored to your business needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/get-started">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Schedule Consultation</Link>
            </Button>
          </div>
        </div>

        {/* Key Benefits */}
        <motion.div variants={staggerChildren} className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose AI Consulting & Future-Proofing?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div variants={fadeIn} key={index}>
                <Card>
                  <CardContent className="p-6">
                    <benefit.icon className="h-8 w-8 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Services Included */}
        <motion.div variants={staggerChildren} className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What's Included?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div variants={fadeIn} key={index}>
                <Card>
                  <CardContent className="p-6">
                    <service.icon className="h-8 w-8 text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Target Audience */}
        <motion.div variants={fadeIn} className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Who Is This For?</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Rocket className="h-6 w-6 text-primary mt-1" />
                  <p>Business leaders looking to leverage AI for operational efficiency.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Rocket className="h-6 w-6 text-primary mt-1" />
                  <p>Companies that want to stay competitive in an AI-driven market.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Rocket className="h-6 w-6 text-primary mt-1" />
                  <p>Organizations in need of custom AI strategies without the guesswork.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div variants={fadeIn} className="text-center">
          <h2 className="text-3xl font-bold mb-4">Transform Your Business with AI Expertise</h2>
          <p className="text-lg text-muted-foreground mb-8">
            AI is reshaping the business world—don't get left behind. With Better Systems AI, you have a dedicated AI partner that ensures your business is always a step ahead.
          </p>
          <Button size="lg" asChild>
            <Link href="/get-started">Start Your AI Journey Today</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
