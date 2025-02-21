import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { ContinuousGallery } from "@/components/ui/continuous-gallery";
import { Gauge, CheckCircle2, TrendingUp, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CaseStudy {
  title: string;
  company: string;
  description: string;
  challenge: string;
  solution: string;
  results: string[];
  metrics: {
    value: string;
    label: string;
    icon: LucideIcon;
  }[];
  images?: {
    src: string;
    title: string;
    alt: string;
  }[];
}

export default function CustomSolutionsPage() {
  const service = {
    title: "Personalized Automation Solution",
    description: "We develop tailored AI applications to meet your specific business needs, automating complex processes and enhancing operational efficiency.",
    features: [
      "Inventory management systems",
      "Automated contracts and proposal generation",
      "Operational dashboards with real-time data",
      "Automated email content creation",
      "CRM enhancements"
    ]
  };

  const caseStudy: CaseStudy = {
    title: "Fleet Management System 2.0",
    company: "Agave Environmental Contract, Inc",
    description: "One of Arizona's largest landscape companies transformed their fleet operations with our custom AI solution.",
    challenge: "Managing a large fleet of vehicles was becoming increasingly complex and time-consuming. The company needed a solution to streamline maintenance tracking, reduce downtime, and improve communication between drivers and maintenance teams.",
    solution: "We developed a comprehensive Fleet Management System that automates problem classification, streamlines maintenance scheduling, and provides real-time insights into fleet operations.",
    results: [
      "35% reduction in fleet operational costs",
      "60% decrease in maintenance response time",
      "90% improvement in communication efficiency",
      "Significant reduction in vehicle downtime"
    ],
    metrics: [
      {
        value: "35%",
        label: "Cost Reduction",
        icon: TrendingUp
      },
      {
        value: "60%",
        label: "Faster Response",
        icon: Timer
      },
      {
        value: "90%",
        label: "Efficiency Gain",
        icon: Gauge
      }
    ],
    images: [
      {
        src: "/images/ai-classification-gallery.png",
        title: "AI Classification Gallery",
        alt: "AI Classification system showcase"
      },
      {
        src: "/images/cost-analysis-reporting.png",
        title: "Cost Analysis and Incident Reporting",
        alt: "Cost analysis and incident reporting interface"
      },
      {
        src: "/images/driver-management.png",
        title: "Driver Management",
        alt: "Driver management interface"
      },
      {
        src: "/images/vehicle-management-detail.png",
        title: "Vehicle Management Detail",
        alt: "Vehicle management detailed view"
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
        <p className="text-muted-foreground text-lg">
          {service.description}
        </p>
      </motion.div>

      <motion.section 
        className="mb-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-2xl font-semibold mb-8">Key Features</h2>
        <ul className="grid md:grid-cols-2 gap-4 mb-16">
          {service.features.map((feature, index) => (
            <motion.li 
              key={index} 
              className="flex items-center gap-2"
              variants={fadeIn}
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {feature}
            </motion.li>
          ))}
        </ul>

        {/* Case Study Section */}
        <div className="bg-muted/30 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8">Success Story: {caseStudy.company}</h2>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4">{caseStudy.title}</h3>
              <p className="text-lg text-muted-foreground mb-6">{caseStudy.description}</p>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">The Challenge:</h4>
                  <p className="text-muted-foreground">{caseStudy.challenge}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Our Solution:</h4>
                  <p className="text-muted-foreground">{caseStudy.solution}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {caseStudy.metrics.map((metric, index) => (
                <Card key={index} className="bg-background/50">
                  <CardContent className="p-6">
                    <metric.icon className="h-8 w-8 text-primary mb-4" />
                    <div className="text-2xl font-bold mb-2">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h4 className="font-semibold mb-4">Key Results:</h4>
            <ul className="grid md:grid-cols-2 gap-4">
              {caseStudy.results.map((result, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{result}</span>
                </li>
              ))}
            </ul>
          </div>

          {caseStudy.images && (
            <div className="mt-8">
              <h4 className="font-semibold mb-6">System Overview</h4>
              <ContinuousGallery images={caseStudy.images} />
            </div>
          )}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.div 
        className="text-center bg-primary/5 rounded-2xl p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Let's discuss how we can create a custom AI solution that addresses your unique business challenges and drives real results.
        </p>
        <Button asChild size="lg">
          <Link href="/get-started">Request Solution</Link>
        </Button>
      </motion.div>
    </div>
  );
}