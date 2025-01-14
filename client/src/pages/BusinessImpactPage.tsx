import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { BarChart3, TrendingUp, BrainCircuit, DollarSign } from "lucide-react";
import { Link } from "wouter";

const economicImpact = [
  {
    title: "Current AI Market",
    value: "$196B",
    growth: "+42.6%",
    description: "Global AI market value in 2024",
    icon: TrendingUp
  },
  {
    title: "Future Market Size",
    value: "$826B",
    growth: "+321%",
    description: "Projected AI market value by 2030",
    icon: BarChart3
  },
  {
    title: "Economic Impact",
    value: "$19.9T",
    growth: "",
    description: "Global economic contribution of AI",
    icon: DollarSign
  },
  {
    title: "ROI Impact",
    value: "4.6x",
    growth: "",
    description: "Return on every $1 spent on AI",
    icon: BrainCircuit
  }
];

const businessPerformance = [
  {
    title: "Finance Sector Growth",
    stats: "88% revenue increase",
    description: "Financial firms seeing revenue growth with AI implementation, with 34% reporting over 20% increase"
  },
  {
    title: "Productivity Enhancement",
    stats: "40% efficiency boost",
    description: "Average productivity increase in organizations implementing AI solutions"
  },
  {
    title: "Decision Making",
    stats: "3x faster insights",
    description: "Acceleration in data analysis and strategic decision-making processes"
  }
];

const adoptionStats = [
  {
    industry: "Financial Services",
    impact: "88% reporting increased revenue, 34% seeing >20% growth"
  },
  {
    industry: "Manufacturing",
    impact: "45% reduction in operational costs through AI automation"
  },
  {
    industry: "Healthcare",
    impact: "35% improvement in patient outcomes with AI diagnostics"
  },
  {
    industry: "Retail",
    impact: "30% increase in sales through AI-powered personalization"
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
          Integrating automation and artificial intelligence (AI) into your business operations isn't just a trend—it's a revolution that's transforming industries worldwide. Here's how AI is set to boost profitability and efficiency for businesses like yours:
        </p>
      </motion.div>

      {/* Economic Impact & Market Growth */}
      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">Economic Impact & Market Growth</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {economicImpact.map((stat, index) => (
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

      {/* Business Performance & Productivity */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-8">Business Performance & Productivity</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {businessPerformance.map((item, index) => (
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

      {/* Adoption & Implementation */}
      <section className="mb-20 bg-primary/5 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-8">Adoption & Implementation</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {adoptionStats.map((item, index) => (
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
            <Link href="/contact">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/founders-social">Contact Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}