import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, BrainCircuit, Phone, Mail, MessageSquare, Share2, MessageCircle, Gauge, Clock, DollarSign, Globe } from "lucide-react";
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
  subtitle?: string;
  description: string;
  metrics: ServiceMetric[];
  channels: Channel[];
  benefits: Benefit[];
}

export default function AIAssistantsPage() {
  const service: ServiceData = {
    title: "AI Assistants",
    subtitle: "For any business to implement",
    description: "AI assistants take over repetitive tasks so you don't have to. Each AI assistant is designed to handle a specific job with speed, accuracy, and efficiency—at a fraction of the cost of a human hire.",
    metrics: [
      {
        value: "90%",
        label: "Cost Reduction",
        description: "Reduce labor costs while boosting productivity",
        icon: DollarSign
      },
      {
        value: "24/7",
        label: "Always On",
        description: "Non-stop task execution across all channels",
        icon: Clock
      },
      {
        value: "< 1s",
        label: "Response Time",
        description: "Instant handling of tasks and inquiries",
        icon: Gauge
      }
    ],
    channels: [
      {
        title: "Email Integration",
        icon: Mail,
        description: "Seamlessly handle email communications with intelligent automation that understands context and intent.",
        capabilities: [
          "Smart categorization and routing",
          "Automated responses",
          "Follow-up management",
          "Document processing"
        ],
        highlight: "Process emails instantly, 24/7"
      },
      {
        title: "Website Integration",
        icon: MessageSquare,
        description: "Convert website visitors into opportunities with intelligent chat interfaces that handle inquiries and guide users.",
        capabilities: [
          "Instant visitor engagement",
          "Lead capture automation",
          "Customer education",
          "Smart routing to resources"
        ],
        highlight: "Capture and qualify leads automatically"
      },
      {
        title: "Phone System Integration",
        icon: Phone,
        description: "Transform your phone system with AI that handles calls, routes inquiries, and provides instant responses.",
        capabilities: [
          "Automated call handling",
          "Smart call routing",
          "Voice-based assistance",
          "Call transcription and analysis"
        ],
        highlight: "Handle calls efficiently at scale"
      },
      {
        title: "Text Messaging Hub",
        icon: MessageCircle,
        description: "Engage through SMS with automated responses, updates, and follow-ups that maintain personal connections.",
        capabilities: [
          "Automated SMS responses",
          "Follow-up scheduling",
          "Status notifications",
          "Campaign management"
        ],
        highlight: "Instant SMS engagement"
      },
      {
        title: "Social Media Management",
        icon: Share2,
        description: "Maintain an active social media presence with AI that monitors, responds, and engages across platforms.",
        capabilities: [
          "Cross-platform management",
          "Automated responses",
          "Content moderation",
          "Engagement tracking"
        ],
        highlight: "Consistent social media presence"
      }
    ],
    benefits: [
      {
        title: "Task Automation",
        description: "Let AI handle repetitive tasks while you focus on strategic decisions"
      },
      {
        title: "Cost Efficiency",
        description: "Reduce operational costs by up to 90% through automation"
      },
      {
        title: "24/7 Operation",
        description: "Your business never sleeps with AI assistants working round the clock"
      },
      {
        title: "Scalable Solution",
        description: "Easily scale operations without proportional cost increases"
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
        <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          {service.title}
        </h1>
        <p className="text-xl text-muted-foreground mb-6">{service.subtitle}</p>
        <p className="text-muted-foreground text-xl leading-relaxed mb-12">
          {service.description}
        </p>

        {/* AI Personal Assistant Video Section */}
        <motion.section
          className="mb-16 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 relative overflow-hidden"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl font-semibold mb-6">How AI-Powered Personal Assistants Save You Time and Increase Your Reach</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Watch how AI personal assistants can handle emails, follow up with leads, and maintain consistent professional communication in seconds.
            </p>
            <div className="aspect-video w-full mb-6 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
              <iframe
                className="w-full h-full rounded-xl shadow-lg"
                src="https://www.youtube.com/embed/POSCaVwm6VQ"
                title="AI Personal Assistant Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <Button asChild>
              <Link href="/services/ai-assistants/personal-assistant-tutorial">
                Learn More
              </Link>
            </Button>
          </div>
        </motion.section>

        {/* Integration Channels Section */}
        <motion.section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">It integrates with:</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 transition-all duration-300 hover:bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 transition-all duration-300 hover:bg-primary/10">
              <Globe className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Websites</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 transition-all duration-300 hover:bg-primary/10">
              <Phone className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Phone systems</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 transition-all duration-300 hover:bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Text messaging</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 transition-all duration-300 hover:bg-primary/10">
              <Share2 className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Social media</span>
            </div>
          </div>
        </motion.section>

        {/* Additional sections showcasing the capabilities */}
        <motion.section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Your AI Assistant Can Help With:</h2>
          <ul className="grid md:grid-cols-2 gap-4">
            <li className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span>Internal business operations</span>
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span>Capturing and managing leads</span>
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span>Following up with customers</span>
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span>Billing and project cost estimation</span>
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span>Educating or redirecting customers</span>
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span>Automating any repetitive task</span>
            </li>
          </ul>
        </motion.section>

        {/* Integrated Communication Channels */}
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
                <Card className="h-full border-0 bg-background/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:bg-primary/5 group">
                  <CardContent className="p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] transform rotate-45 transition-all duration-300 group-hover:scale-110" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-primary/10 text-primary transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <channel.icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-semibold">{channel.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-8 leading-relaxed text-lg">{channel.description}</p>
                    <ul className="space-y-4 mb-8">
                      {channel.capabilities.map((capability, capIndex) => (
                        <motion.li
                          key={capIndex}
                          className="flex items-start gap-3 group/item"
                          variants={fadeIn}
                          whileHover={{ x: 4 }}
                        >
                          <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-1 transform transition-all duration-300 group-hover/item:scale-110" />
                          <span className="text-base">{capability}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <div className="pt-6 border-t border-border">
                      <div className="flex items-center gap-3 text-primary transition-all duration-300 hover:translate-x-1">
                        <BrainCircuit className="h-6 w-6 animate-pulse" />
                        <span className="font-semibold text-lg">{channel.highlight}</span>
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
          className="mb-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-12 relative overflow-hidden"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl font-semibold mb-6">Experience AI Innovation Live</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Watch our AI Assistant seamlessly handle complex customer interactions in real-time.
              See how natural language processing and contextual understanding create human-like conversations
              that drive results.
            </p>
            <div className="aspect-video w-full transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
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
                  <CardContent className="p-8 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transform rotate-45" />
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <span className="text-2xl font-bold text-primary">{index + 1}</span>
                    </div>
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
              <Link href="/get-started">Request Solution</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}