import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";

import { ImageCarousel } from "@/components/ui/image-carousel";

export default function FleetManagementPage() {
  const service = {
    title: "Fleet Management System 2.0",
    description: "Managing a fleet can be complex and time-consuming. Our Fleet Management System simplifies every aspect of vehicle oversight, from repair tracking to operational insights. Powered by advanced automation and AI, this system streamlines workflows, reduces downtime, and enhances communication—saving you time and money.",
    keyFeatures: [
      {
        title: "AI-Powered Problem Classification",
        description: "Issues reported by drivers are automatically categorized for faster resolution, ensuring repairs are assigned to the right team instantly.",
        examples: ["Oil changes", "Battery issues", "Cooling system problems", "Structural damage"]
      },
      {
        title: "Enhanced Repair Request System",
        description: "Track and manage repairs efficiently with our unified system.",
        features: [
          "Unified Status Tracking",
          "Bilingual Forms (English/Spanish)",
          "Image Attachments",
          "AI Processing (~6 seconds)"
        ]
      },
      {
        title: "Comprehensive Dashboard",
        description: "Stay on top of your fleet's needs with actionable insights.",
        features: [
          "Cost Analysis",
          "Monthly Trends",
          "Historical Data Access"
        ]
      }
    ],
    benefits: [
      "Automation & Efficiency: Save time by reducing manual processes",
      "Enhanced Communication: Keep everyone informed with real-time updates",
      "Data-Driven Insights: Make smarter decisions with detailed analytics",
      "Streamlined Workflows: Minimize downtime with simplified operations"
    ],
    additionalFeatures: [
      {
        title: "Advanced Time and Cost Metrics",
        points: ["Repair Tracking", "Cost Validation"]
      },
      {
        title: "Simplified Appointment Scheduling",
        points: ["Consolidated Booking System", "Priority Status", "QR Code Integration"]
      },
      {
        title: "Vehicle Data Integration",
        points: ["Comprehensive Vehicle Records", "Supervisor Access"]
      },
      {
        title: "Real-Time Driver Notifications",
        points: ["Status Updates", "Driver Notes"]
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <motion.div 
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-6">{service.title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {service.description}
        </p>
      </motion.div>

      {/* Fleet Management Carousel */}
      <motion.section 
        className="mb-16"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <ImageCarousel
          images={[
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
            },
            {
              src: "/images/vehicle-management-detail-2.png",
              title: "Vehicle Management Detail 2",
              alt: "Additional vehicle management interface"
            }
          ]}
        />
      </motion.section>

      {/* Key Features Section */}
      <motion.section 
        className="mb-16"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8">Key Features</h2>
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerChildren}
        >
          {service.keyFeatures.map((feature, index) => (
            <motion.div key={index} variants={fadeIn}>
              <Card className="h-full">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  {feature.examples && (
                    <div>
                      <h4 className="font-medium mb-2">Examples:</h4>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {feature.examples.map((example, i) => (
                          <li key={i}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feature.features && (
                    <ul className="space-y-2">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Benefits Section */}
      <section className="mb-16 bg-primary/5 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-8">Benefits at a Glance</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {service.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-4">
              <span className="size-2 rounded-full bg-primary mt-2" />
              <p className="text-lg">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video Tutorial Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-4">Video Tutorial</h2>
        <p className="text-lg text-muted-foreground mb-6">
          As part of our comprehensive Fleet Management System, we provide detailed video tutorials to ensure your team gets the most out of our solution. Our tutorial library walks you through every feature, helping your staff master the system quickly and efficiently. Watch below for an overview of our key features and best practices.
        </p>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/xzkGsKIGNfA"
            title="Fleet Management System Tutorial"
            className="absolute inset-0 w-full h-full rounded-lg"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Additional Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {service.additionalFeatures.map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <ul className="space-y-2">
                  {feature.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <div className="text-center bg-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Take Control of Your Fleet Today</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Ready to transform your fleet operations? Our Fleet Management System delivers everything 
          you need to stay ahead—whether you're managing a handful of vehicles or a large-scale operation.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/get-started">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/booking">Schedule Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
