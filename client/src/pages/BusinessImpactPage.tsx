import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { BarChart3, TrendingUp, BrainCircuit, DollarSign } from "lucide-react";

const impactStats = [
  {
    title: "AI Market Growth",
    value: "$407B",
    growth: "+38.1%",
    description: "Expected global AI market size by 2027",
    icon: TrendingUp
  },
  {
    title: "Productivity Boost",
    value: "40%",
    growth: "+15%",
    description: "Average productivity increase with AI implementation",
    icon: BarChart3
  },
  {
    title: "AI Adoption Rate",
    value: "35%",
    growth: "+12%",
    description: "Businesses implementing AI solutions in 2024",
    icon: BrainCircuit
  },
  {
    title: "Cost Reduction",
    value: "25%",
    growth: "+8%",
    description: "Average operational cost savings with AI",
    icon: DollarSign
  }
];

const businessCases = [
  {
    title: "Customer Service Enhancement",
    stats: "70% faster response times",
    description: "AI-powered chatbots and virtual assistants dramatically improve customer service efficiency and satisfaction."
  },
  {
    title: "Process Automation",
    stats: "45% reduction in manual tasks",
    description: "Intelligent automation streamlines workflows and reduces human error in routine operations."
  },
  {
    title: "Data Analysis & Insights",
    stats: "3x faster decision making",
    description: "Advanced analytics and AI-driven insights enable better and faster strategic decisions."
  }
];

const industryImpacts = [
  {
    industry: "Manufacturing",
    impact: "Predictive maintenance reducing downtime by 50%"
  },
  {
    industry: "Healthcare",
    impact: "Diagnostic accuracy improved by 40%"
  },
  {
    industry: "Retail",
    impact: "Personalization driving 30% higher sales"
  },
  {
    industry: "Finance",
    impact: "Fraud detection improved by 60%"
  }
];

export default function BusinessImpactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <motion.div 
        className="max-w-3xl mx-auto mb-16 text-center"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <h1 className="text-4xl font-bold mb-6">Business Impact of AI</h1>
        <p className="text-xl text-muted-foreground">
          Discover how AI is transforming businesses across industries and driving 
          unprecedented growth and efficiency.
        </p>
      </motion.div>

      {/* Key Statistics Grid */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impactStats.map((stat, index) => (
            <motion.div key={index} variants={fadeIn}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium text-emerald-600">{stat.growth}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{stat.title}</h3>
                  <p className="text-3xl font-bold mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Business Cases Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Real Business Impact</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {businessCases.map((item, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-2xl font-bold text-primary mb-3">{item.stats}</p>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Industry Impact Section */}
      <section className="mb-20 bg-primary/5 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Industry-Specific Impact</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {industryImpacts.map((item, index) => (
            <Card key={index} className="border-0 bg-background">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">{item.industry}</h3>
                <p className="text-muted-foreground">{item.impact}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join the AI revolution and stay ahead of the competition. Let us help you 
          leverage AI to achieve unprecedented growth and efficiency.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <a href="/contact">Get Started</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/booking">Schedule Consultation</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
