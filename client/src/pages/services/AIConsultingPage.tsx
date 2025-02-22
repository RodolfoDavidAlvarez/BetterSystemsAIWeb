import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import Booking from "@/components/sections/Booking";

export default function AIConsultingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          {/* Hero Section */}
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">AI Consulting & Future-Proofing</h1>
            <h2 className="text-2xl font-semibold mb-2">Stay Ahead with AI-Driven Innovation</h2>
            <p className="text-xl text-muted-foreground">
              Future-Proof Your Business with Cutting-Edge AI Strategies
            </p>
          </motion.div>

          {/* Main Value Proposition */}
          <motion.div variants={fadeIn} className="bg-card rounded-xl p-8 shadow-lg mb-12 border border-border/50">
            <p className="text-lg leading-relaxed">
              AI is evolving fast—will your business keep up? Our AI Consulting & Future-Proofing service ensures you stay ahead of the curve with continuous guidance, industry insights, and proactive AI strategies tailored to your business needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="flex items-center gap-3">
                <span>Predict & Adapt to AI Trends</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Optimize Business Operations with AI</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Gain a Competitive Edge in Your Industry</span>
              </div>
            </div>
          </motion.div>

          {/* Why Choose Us Section */}
          <motion.div variants={fadeIn} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Why Choose AI Consulting & Future-Proofing?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Ongoing AI Guidance – Get continuous access to AI experts who analyze trends and recommend strategic improvements.",
                "Proactive AI Updates – Be the first to know about new AI tools, breakthroughs, and automation advancements relevant to your industry.",
                "Customized AI Strategies – Tailored AI roadmaps designed to enhance your operations, efficiency, and scalability.",
                "Long-Term Competitive Advantage – AI isn't just about keeping up—it's about leading. Stay ahead with future-proof AI implementation."
              ].map((item, index) => (
                <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <p className="text-foreground/90">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* What's Included Section */}
          <motion.div variants={fadeIn} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">What's Included?</h3>
            <div className="space-y-4">
              {[
                "AI Strategy Assessment – We evaluate your current AI adoption and identify opportunities for improvement.",
                "Quarterly Optimization Reviews – Regular evaluations of your AI solutions to ensure maximum efficiency.",
                "Industry Trends & Alerts – Curated reports on the latest AI advancements and how they impact your business.",
                "Exclusive AI Consultation – Priority access to expert strategists for personalized AI advice.",
                "Implementation Roadmap – Step-by-step guidance on integrating AI into your workflow for sustainable growth."
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                  <p className="text-foreground/90">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Who Is This For Section */}
          <motion.div variants={fadeIn} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Who Is This For?</h3>
            <div className="space-y-4">
              {[
                "Business leaders looking to leverage AI for operational efficiency.",
                "Companies that want to stay competitive in an AI-driven market.",
                "Organizations in need of custom AI strategies without the guesswork."
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                  <p className="text-foreground/90">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Transform Section */}
          <motion.div variants={fadeIn} className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Transform Your Business with AI Expertise</h2>
            <p className="text-xl text-muted-foreground">
              AI is reshaping the business world—don't get left behind. With Better Systems AI, you have a dedicated AI partner that ensures your business is always a step ahead.
            </p>
          </motion.div>

          {/* CTA Section */}
          <motion.div variants={fadeIn} className="text-center">
            <Button asChild size="lg" className="group">
              <Link href="/get-started">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Booking Section */}
      <Booking />
    </div>
  );
}