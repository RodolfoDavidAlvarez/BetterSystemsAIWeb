import { motion } from "framer-motion";
import { ArrowRight, Clock, DollarSign, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIPersonalAssistantTutorialPage() {
  return (
    <div className="container max-w-5xl py-16">
      <div className="mb-12">
        <Link href="/services/ai-assistants" className="text-primary hover:underline inline-flex items-center mb-4">
          <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
          Back to AI Assistants
        </Link>
        
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-6"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          How AI-Powered Personal Assistants Save You Time and Increase Your Reach
        </motion.h1>
      </div>

      <motion.section 
        className="mb-12 prose prose-lg max-w-none"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.p variants={fadeIn} className="text-xl leading-relaxed">
          Every business owner knows the frustration—sending emails, following up with leads, and maintaining consistent, 
          professional communication takes too much time. But now, AI-powered personal assistants can do it for you 
          in seconds—and we can help you integrate them seamlessly into your workflow.
        </motion.p>
      </motion.section>

      <motion.section 
        className="mb-16"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.h2 variants={fadeIn} className="text-2xl font-semibold mb-6">
          What You'll See in This Video:
        </motion.h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div variants={fadeIn}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <Mail className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-medium mb-2">Instant email drafting</h3>
                <p className="text-foreground/80 flex-grow">
                  Send high-quality, personalized emails in under a minute.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <DollarSign className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-medium mb-2">Automated lead generation</h3>
                <p className="text-foreground/80 flex-grow">
                  Find and reach out to potential customers effortlessly.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <svg 
                  className="h-8 w-8 text-primary mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="text-xl font-medium mb-2">Consistent messaging</h3>
                <p className="text-muted-foreground flex-grow">
                  Ensure professional, accurate, and cohesive communication across your company.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeIn}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <Clock className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-medium mb-2">Time-saving automation</h3>
                <p className="text-muted-foreground flex-grow">
                  Reduce hours spent on repetitive tasks while increasing productivity.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="mb-16"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-2xl font-semibold mb-6">
          Watch the Video Below to See It in Action:
        </h2>
        
        <div className="aspect-video w-full mb-6">
          <iframe
            className="w-full h-full rounded-xl shadow-lg"
            src="https://www.youtube.com/embed/POSCaVwm6VQ"
            title="AI Personal Assistant Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </motion.section>

      <motion.section 
        className="mb-16 bg-primary/5 p-8 rounded-xl"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.h2 variants={fadeIn} className="text-2xl font-semibold mb-6">
          Why This Matters for Your Business
        </motion.h2>
        
        <ul className="space-y-4">
          <motion.li variants={fadeIn} className="flex items-start gap-4">
            <Badge className="mt-1 bg-primary text-primary-foreground">Efficiency</Badge>
            <div>
              <strong className="block mb-1">Manually drafting emails is inefficient</strong>
              <p className="text-muted-foreground">
                AI allows you to focus on high-impact work instead.
              </p>
            </div>
          </motion.li>
          
          <motion.li variants={fadeIn} className="flex items-start gap-4">
            <Badge className="mt-1 bg-primary text-primary-foreground">Outreach</Badge>
            <div>
              <strong className="block mb-1">Finding and contacting leads is time-consuming</strong>
              <p className="text-muted-foreground">
                AI speeds up the process, increasing outreach and conversions.
              </p>
            </div>
          </motion.li>
          
          <motion.li variants={fadeIn} className="flex items-start gap-4">
            <Badge className="mt-1 bg-primary text-primary-foreground">Consistency</Badge>
            <div>
              <strong className="block mb-1">Keeping messaging aligned is a challenge</strong>
              <p className="text-muted-foreground">
                AI ensures every communication stays professional and consistent.
              </p>
            </div>
          </motion.li>
        </ul>
        
        <motion.p variants={fadeIn} className="mt-6 text-lg">
          AI personal assistants are becoming a standard tool for businesses looking to stay competitive. 
          We can help you implement them efficiently so you maximize productivity without the hassle.
        </motion.p>
      </motion.section>

      <motion.div 
        className="text-center"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <p className="text-xl mb-6">
          Want to integrate AI-powered assistants into your business? We're here to help.
        </p>
        <Button asChild size="lg">
          <Link href="/contact">
            Get Started
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}