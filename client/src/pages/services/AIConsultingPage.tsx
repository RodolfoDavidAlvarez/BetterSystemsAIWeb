import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

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
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              AI Consulting & Future-Proofing
            </h1>
            <h2 className="text-2xl font-semibold mb-6 text-foreground/90">
              Stay Ahead with AI-Driven Innovation
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Future-Proof Your Business with Cutting-Edge AI Strategies. AI is evolving fast—will your business keep up? Our AI Consulting & Future-Proofing service ensures you stay ahead of the curve with continuous guidance, industry insights, and proactive AI strategies tailored to your business needs.
            </p>
          </motion.div>

          {/* Features Section */}
          <motion.div variants={fadeIn} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Key Features</h3>
            <div className="grid gap-4">
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Predict & Adapt to AI Trends</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Optimize Business Operations with AI</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Gain a Competitive Edge in Your Industry</p>
              </div>
            </div>
          </motion.div>

          {/* Benefits Section */}
          <motion.div variants={fadeIn} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Why Choose AI Consulting & Future-Proofing?</h3>
            <div className="grid gap-4">
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Ongoing AI Guidance – Get continuous access to AI experts who analyze trends and recommend strategic improvements.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Proactive AI Updates – Be the first to know about new AI tools, breakthroughs, and automation advancements relevant to your industry.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Customized AI Strategies – Tailored AI roadmaps designed to enhance your operations, efficiency, and scalability.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Long-Term Competitive Advantage – AI isn't just about keeping up—it's about leading. Stay ahead with future-proof AI implementation.</p>
              </div>
            </div>
          </motion.div>

          {/* Services Section */}
          <motion.div variants={fadeIn} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">What's Included?</h3>
            <div className="grid gap-4">
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">AI Strategy Assessment – We evaluate your current AI adoption and identify opportunities for improvement.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Quarterly Optimization Reviews – Regular evaluations of your AI solutions to ensure maximum efficiency.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border/50">
                <p className="text-foreground/90">Industry Trends & Alerts – Curated reports on the latest AI advancements and how they impact your business.</p>
              </div>
            </div>
          </motion.div>

          {/* Who Is This For Section */}
          <motion.div variants={fadeIn} className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Who Is This For?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "Business leaders looking to leverage AI for operational efficiency.",
                "Companies that want to stay competitive in an AI-driven market.",
                "Organizations in need of custom AI strategies without the guesswork."
              ].map((item, index) => (
                <div key={index} className="p-6 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                  <p className="text-foreground/90">{item}</p>
                </div>
              ))}
            </div>
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
    </div>
  );
}