import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { BrainCircuit, LineChart, Users, Cog, Mail, Globe, Phone, MessageSquare, Share2 } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      title: "AI Consulting",
      description: "Expert guidance on implementing AI solutions",
      icon: BrainCircuit,
      link: "/services/ai-consulting"
    },
    {
      title: "Business Efficiency Assessment",
      description: "Comprehensive analysis of your operations",
      icon: LineChart,
      link: "/services/efficiency-audit"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="grid md:grid-cols-2 gap-8"
      >
        {services.map((service, index) => (
          <motion.div key={index} variants={fadeIn} className="group">
            <a href={service.link} className="block p-6 rounded-lg bg-card hover:bg-card/60 transition-colors">
              <service.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
              <p className="text-muted-foreground mb-4">{service.description}</p>
              <span className="text-primary group-hover:underline">Learn more →</span>
            </a>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}