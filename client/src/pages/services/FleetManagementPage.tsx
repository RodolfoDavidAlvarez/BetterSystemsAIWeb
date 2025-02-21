import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { ContinuousGallery } from "@/components/ui/continuous-gallery";
import { Gauge, CheckCircle2, TrendingUp, Timer, ArrowLeft } from "lucide-react";

export default function FleetManagementPage() {
  const caseStudy = {
    title: "Fleet Management System 2.0",
    company: "Agave Environmental Contract, Inc",
    description: "One of Arizona's largest landscape companies transformed their fleet operations with our custom AI solution.",
    challenge: "Managing a large fleet of vehicles was becoming increasingly complex and time-consuming. The company needed a solution to streamline maintenance tracking, reduce downtime, and improve communication between drivers and maintenance teams.",
    solution: "We developed a comprehensive Fleet Management System that automates problem classification, streamlines maintenance scheduling, and provides real-time insights into fleet operations.",
    features: [
      {
        title: "AI-Powered Problem Classification",
        description: "Issues reported by drivers are automatically categorized for faster resolution, ensuring repairs are assigned to the right team instantly.",
        examples: ["Oil changes", "Battery issues", "Cooling system problems", "Structural damage"]
      },
      {
        title: "Real-Time Communication",
        description: "Instant notifications and updates keep all stakeholders informed about vehicle status and maintenance progress.",
        examples: ["Status updates", "Maintenance alerts", "Completion notifications", "Driver feedback"]
      },
      {
        title: "Comprehensive Dashboard",
        description: "Stay on top of your fleet's needs with actionable insights.",
        examples: ["Cost Analysis", "Monthly Trends", "Historical Data", "Performance Metrics"]
      }
    ],
    results: [
      {
        metric: "35%",
        label: "Cost Reduction",
        description: "Significant decrease in operational costs through efficient maintenance scheduling and reduced downtime",
        icon: TrendingUp
      },
      {
        metric: "60%",
        label: "Faster Response",
        description: "Dramatic improvement in maintenance response times through automated issue classification",
        icon: Timer
      },
      {
        metric: "90%",
        label: "Efficiency Gain",
        description: "Enhanced communication and streamlined workflows lead to significant operational efficiency",
        icon: Gauge
      }
    ],
    testimonial: {
      quote: "Better Systems AI's Fleet Management System has revolutionized how we handle our vehicle maintenance. The automation and real-time insights have been game-changing for our operations.",
      author: "Operations Director, Agave Environmental Contract, Inc"
    },
    gallery: [
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
        className="max-w-4xl mx-auto"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/services/custom-solutions" className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Custom Solutions
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold mb-4">{caseStudy.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">{caseStudy.company}</p>
          <p className="text-lg text-muted-foreground">{caseStudy.description}</p>
        </div>

        {/* Challenge & Solution Section */}
        <motion.section className="mb-16" variants={staggerChildren}>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">The Challenge</h2>
                <p className="text-muted-foreground">{caseStudy.challenge}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Our Solution</h2>
                <p className="text-muted-foreground">{caseStudy.solution}</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section className="mb-16" variants={staggerChildren}>
          <h2 className="text-3xl font-bold mb-8">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudy.features.map((feature, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.examples.map((example, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-sm">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Visual Gallery */}
        <motion.section className="mb-16" variants={fadeIn}>
          <h2 className="text-3xl font-bold mb-8">System Overview</h2>
          <ContinuousGallery images={caseStudy.gallery} />
        </motion.section>

        {/* Results Section */}
        <motion.section className="mb-16" variants={staggerChildren}>
          <h2 className="text-3xl font-bold mb-8">Results & Impact</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudy.results.map((result, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <result.icon className="h-8 w-8 text-primary mb-4" />
                    <div className="text-3xl font-bold mb-2">{result.metric}</div>
                    <div className="font-semibold mb-2">{result.label}</div>
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Testimonial Section */}
        <motion.section
          className="mb-16 bg-primary/5 rounded-2xl p-8 relative overflow-hidden"
          variants={fadeIn}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <div className="text-4xl text-primary mb-4">❝</div>
            <p className="text-xl italic mb-4">{caseStudy.testimonial.quote}</p>
            <p className="text-muted-foreground">— {caseStudy.testimonial.author}</p>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="text-center bg-primary/5 rounded-2xl p-12"
          variants={fadeIn}
        >
          <h2 className="text-3xl font-bold mb-4">Transform Your Fleet Operations</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ready to revolutionize your fleet management? Let us help you achieve similar results with a custom solution tailored to your needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/get-started">Request Demo</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}