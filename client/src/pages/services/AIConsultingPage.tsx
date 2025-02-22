import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Booking from "@/components/sections/Booking";

export default function AIConsultingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          className="max-w-4xl mx-auto space-y-12"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          {/* Hero Section */}
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              AI Consulting & Future-Proofing
            </h1>
            <h2 className="text-2xl font-semibold mb-6">
              Stay Ahead with AI-Driven Innovation
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Future-Proof Your Business with Cutting-Edge AI Strategies
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              AI is evolving fast—will your business keep up? Our AI Consulting & Future-Proofing service ensures you stay ahead of the curve with continuous guidance, industry insights, and proactive AI strategies tailored to your business needs.
            </p>
          </motion.div>

          {/* Key Features */}
          <motion.div variants={fadeIn} className="grid gap-6 text-center">
            <div className="p-6 rounded-lg bg-card border">
              <h3 className="text-xl font-semibold mb-4">Key Benefits</h3>
              <ul className="space-y-4">
                <li>🔹 Predict & Adapt to AI Trends</li>
                <li>🔹 Optimize Business Operations with AI</li>
                <li>🔹 Gain a Competitive Edge in Your Industry</li>
              </ul>
            </div>
          </motion.div>

          {/* Why Choose Us */}
          <motion.div variants={fadeIn} className="space-y-6">
            <h3 className="text-2xl font-semibold text-center mb-6">Why Choose AI Consulting & Future-Proofing?</h3>
            <div className="grid gap-6">
              <div className="p-6 rounded-lg bg-card border">
                <ul className="space-y-4">
                  <li>💪 Ongoing AI Guidance – Get continuous access to AI experts who analyze trends and recommend strategic improvements.</li>
                  <li>💪 Proactive AI Updates – Be the first to know about new AI tools, breakthroughs, and automation advancements relevant to your industry.</li>
                  <li>💪 Customized AI Strategies – Tailored AI roadmaps designed to enhance your operations, efficiency, and scalability.</li>
                  <li>💪 Long-Term Competitive Advantage – AI isn't just about keeping up—it's about leading. Stay ahead with future-proof AI implementation.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* What's Included */}
          <motion.div variants={fadeIn} className="space-y-6">
            <h3 className="text-2xl font-semibold text-center mb-6">What's Included?</h3>
            <div className="p-6 rounded-lg bg-card border">
              <ul className="space-y-4">
                <li>📌 AI Strategy Assessment – We evaluate your current AI adoption and identify opportunities for improvement.</li>
                <li>📌 Quarterly Optimization Reviews – Regular evaluations of your AI solutions to ensure maximum efficiency.</li>
                <li>📌 Industry Trends & Alerts – Curated reports on the latest AI advancements and how they impact your business.</li>
              </ul>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div variants={fadeIn} className="text-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/contact">Get Started Today</Link>
            </Button>
          </motion.div>

          {/* Booking Section */}
          <Booking />
        </motion.div>
      </div>
    </div>
  );
}