import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, BrainCircuit, Phone, Mail, MessageSquare, Share2, MessageCircle, Gauge, Clock, DollarSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceMetric {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface Channel {
  title: string;
  icon: LucideIcon;
  description: string;
  capabilities: string[];
  highlight: string;
}

interface Benefit {
  title: string;
  description: string;
}

interface ServiceData {
  title: string;
  description: string;
  metrics: ServiceMetric[];
  channels: Channel[];
  benefits: Benefit[];
}

export default function AIAssistantsPage() {
  const service: ServiceData = {
    title: "AI-Powered Assistant Integrations",
    description: "Transform your business communication with cutting-edge AI assistants. Our intelligent virtual agents handle customer interactions across all channels, delivering 24/7 support with human-like understanding.",
    metrics: [
      {
        value: "70%",
        label: "Cost Reduction",
        description: "Lower support costs",
        icon: DollarSign
      },
      {
        value: "24/7",
        label: "Availability",
        description: "Round-the-clock service",
        icon: Clock
      },
      {
        value: "90%",
        label: "Efficiency",
        description: "Faster response times",
        icon: Gauge
      }
    ],
    channels: [
      {
        title: "Smart Voice Assistant",
        icon: Phone,
        description: "Experience seamless communication with our advanced AI voice system that understands context, emotion, and intent. Handle high call volumes effortlessly while maintaining a personal touch.",
        capabilities: [
          "Natural conversations with 98% accuracy",
          "Smart routing based on customer intent",
          "Support in 100+ languages",
          "Real-time transcription & insights"
        ],
        highlight: "Reduce call wait times by up to 80%"
      },
      {
        title: "Intelligent Email Hub",
        icon: Mail,
        description: "Transform your email workflow with AI that understands context, intent, and urgency. Automatically process, categorize, and respond to emails with human-like precision.",
        capabilities: [
          "Smart categorization with 99% accuracy",
          "Contextual response generation",
          "Document analysis & processing",
          "Intelligent priority management"
        ],
        highlight: "Process emails 5x faster than traditional methods"
      },
      {
        title: "Interactive Web Assistant",
        icon: MessageSquare,
        description: "Deploy an AI-powered chat interface that provides instant, personalized assistance to website visitors. Convert inquiries into opportunities with intelligent conversation flows.",
        capabilities: [
          "Instant 24/7 visitor support",
          "Smart product recommendations",
          "Dynamic FAQ & knowledge base",
          "Qualified lead generation"
        ],
        highlight: "Convert 40% more visitors into leads"
      },
      {
        title: "Social Media Command Center",
        icon: Share2,
        description: "Unify your social media presence with AI-driven engagement tools. Monitor, respond, and analyze interactions across all platforms from a single dashboard.",
        capabilities: [
          "Cross-platform message handling",
          "Smart content moderation",
          "Real-time sentiment tracking",
          "Performance analytics dashboard"
        ],
        highlight: "Improve response time by 75%"
      },
      {
        title: "Smart SMS Gateway",
        icon: MessageCircle,
        description: "Engage customers through personalized text messaging powered by AI. Send timely updates and handle responses automatically while maintaining a personal connection.",
        capabilities: [
          "Intelligent scheduling system",
          "Real-time status notifications",
          "Natural conversation flow",
          "Campaign optimization"
        ],
        highlight: "Achieve 98% message open rates"
      }
    ],
    benefits: [
      {
        title: "24/7 Availability",
        description: "Provide round-the-clock support without increasing operational costs"
      },
      {
        title: "Increased Efficiency",
        description: "Handle thousands of interactions simultaneously while maintaining quality"
      },
      {
        title: "Cost Reduction",
        description: "Reduce operational costs by up to 70% through automation"
      },
      {
        title: "Better Customer Experience",
        description: "Instant responses and consistent service across all channels"
      }
    ]
  };

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
        <h1 className="text-5xl font-bold mb-6">{service.title}</h1>
        <p className="text-muted-foreground text-xl leading-relaxed mb-12">
          {service.description}
        </p>
        
        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {service.metrics.map((metric, index) => (
            <Card key={index} className="border-0 bg-primary/5 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <metric.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="font-semibold mb-2">{metric.label}</div>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.section className="space-y-12 mb-16">
        <h2 className="text-3xl font-semibold text-center mb-12">Integrated Communication Channels</h2>
        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          {service.channels.map((channel, index) => (
            <motion.div 
              key={index} 
              className="group"
              variants={fadeIn}
            >
              <Card className="h-full border-0 bg-background/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <channel.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-semibold">{channel.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{channel.description}</p>
                  <ul className="space-y-3 mb-6">
                    {channel.capabilities.map((capability, capIndex) => (
                      <motion.li 
                        key={capIndex} 
                        className="flex items-center gap-3"
                        variants={fadeIn}
                      >
                        <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{capability}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-primary">
                      <BrainCircuit className="h-5 w-5" />
                      <span className="font-semibold">{channel.highlight}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Demo Video Section */}
      <motion.section 
        className="mb-20 bg-primary/5 rounded-2xl p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">See AI Assistant in Action</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Watch how our AI Assistant handles real-world scenarios with natural conversation flow and intelligent decision-making.
          </p>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full rounded-xl shadow-lg"
              src="https://www.youtube.com/embed/_36nIgx8Lic"
              title="AI Assistant Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-semibold text-center mb-12">Transform Your Business Communication</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {service.benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              variants={fadeIn}
            >
              <Card className="h-full border-0 bg-background/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-primary/5">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-4">{benefit.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="text-center bg-primary/5 rounded-2xl p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-semibold mb-4">Ready to Transform Your Customer Experience?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join innovative businesses already using our AI Assistants to deliver exceptional customer service while reducing costs.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="px-8">
            <Link href="/get-started">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
