import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, Clock, FileText, TrendingUp, CheckCircle2 } from "lucide-react";
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
}

interface FAQ {
  question: string;
  answer: string;
}

interface ServiceData {
  title: string;
  description: string;
  includedFeatures: ServiceFeature[];
  whyChooseUs: string[];
  process: ProcessStep[];
  testimonials: Testimonial[];
  faqs: FAQ[];
}

export default function EfficiencyAuditPage() {
  const service: ServiceData = {
    title: "Business Efficiency & Savings Assessment",
    description: "Discover how much time, money, and resources your business could save with our expert Business Efficiency & Savings Assessment.",
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
    whyChooseUs: [
      "Proven Results: We've helped businesses just like yours save thousands of dollars annually and free up hundreds of hours of valuable time.",
      "No-Risk Guarantee: This assessment is completely free, with no obligation to purchase.",
      "Tailored to You: Your business is unique, and so are our solutions."
    ],
    process: [
      {
        title: "Complete a Quick Pre-Questionnaire",
        description: "Help us understand your business with a few simple questions."
      },
      {
        title: "Schedule Your Free Consultation",
        description: "Book a 30-minute call to review your operations with our experts."
      },
      {
        title: "Receive Your Custom Report",
        description: "Get a detailed, actionable breakdown of your savings and productivity potential."
      }
    ],
    testimonials: [
      {
        quote: "Better Systems AI helped us save over $20,000 a year and automate processes we didn't even realize were holding us back. Highly recommend!",
        author: "Sarah L., Small Business Owner"
      },
      {
        quote: "The efficiency report was an eye-opener. We implemented just two of their recommendations and saw immediate results.",
        author: "John M., Startup Founder"
      }
    ],
    faqs: [
      {
        question: "What does the assessment cost?",
        answer: "Nothing! It's 100% free – no strings attached."
      },
      {
        question: "How long does it take?",
        answer: "The pre-questionnaire takes about 10 minutes, and the consultation is just 30 minutes."
      },
      {
        question: "What happens after the assessment?",
        answer: "You'll get a custom report. If you want our help implementing solutions, we'll offer tailored packages, but there's no obligation."
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
        <h1 className="text-5xl font-bold mb-6">{service.title}</h1>
        <p className="text-muted-foreground text-xl leading-relaxed">
          {service.description}
        </p>
      </motion.div>

      {/* What's Included Section */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">What's Included in Your Free Assessment?</h2>
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

      {/* Why Choose Us Section */}
      <motion.section 
        className="mb-20 bg-primary/5 rounded-2xl p-8"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">Why Choose Us?</h2>
        <div className="grid gap-6">
          {service.whyChooseUs.map((item, index) => (
            <motion.div 
              key={index}
              className="flex items-start gap-4"
              variants={fadeIn}
            >
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <p className="text-lg">{item}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">How It Works</h2>
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-8">
            {service.process.map((step, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="h-full border-0 bg-background/40 hover:bg-background/60 transition-colors shadow-sm">
                  <CardContent className="p-6">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-primary">{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="lg" 
              className="text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all" 
              asChild
            >
              <Link href="/services/pre-assessment">Start Questionnaire →</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">Customer Testimonials</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {service.testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeIn}>
              <Card className="h-full border-0 bg-background/40 hover:bg-background/60 transition-colors shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 text-4xl text-primary">❝</div>
                  <p className="text-lg mb-4 italic">{testimonial.quote}</p>
                  <p className="text-muted-foreground">– {testimonial.author}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="grid gap-6">
          {service.faqs.map((faq, index) => (
            <motion.div key={index} variants={fadeIn}>
              <Card className="border-0 bg-background/40 hover:bg-background/60 transition-colors shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
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
        <h2 className="text-3xl font-bold mb-4">Take the First Step Towards Efficiency and Savings</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Don't wait—every minute wasted is money left on the table. Let us help you reclaim your time and maximize your potential.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/services/pre-assessment">Start Your Free Assessment</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
