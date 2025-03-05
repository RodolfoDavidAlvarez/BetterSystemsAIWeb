import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  ArrowRight, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  BarChart, 
  Shield, 
  Cpu, 
  CarFront, 
  Users, 
  Clipboard, 
  FileSpreadsheet, 
  LineChart, 
  Maximize2,
  Wrench,
  Car,
  CalendarCheck,
  Building,
  ExternalLink
} from 'lucide-react';

import { fadeIn, staggerChildren } from '../../lib/animations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogClose, DialogTrigger } from "../../components/ui/dialog"

export default function FleetManagementPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Gallery Images
  const galleryImages = [
    {
      src: "/images/vehicle-management-detail.png",
      title: "Vehicle Management Dashboard",
      alt: "Vehicle management dashboard showing detailed vehicle information"
    },
    {
      src: "/images/driver-management.png",
      title: "Driver Management Interface",
      alt: "Driver management interface with driver details and assignments"
    },
    {
      src: "/images/ai-classification-gallery.png",
      title: "AI-Powered Classification",
      alt: "AI classification system for vehicle and resource management"
    },
    {
      src: "/images/cost-analysis-reporting.png",
      title: "Cost Analysis & Reporting",
      alt: "Cost analysis and incident reporting dashboard"
    }
  ];

  // Features List
  const features = [
    {
      icon: CarFront,
      title: "Vehicle Tracking & Management",
      description: "Real-time GPS tracking and comprehensive vehicle history including maintenance records, fuel usage, and performance metrics."
    },
    {
      icon: Users,
      title: "Driver Management",
      description: "Complete driver profiles with licensing information, training records, safety scores, and assignment histories."
    },
    {
      icon: Clipboard,
      title: "Maintenance Scheduling",
      description: "Automated maintenance alerts based on mileage, engine hours, and calendar dates with work order creation and tracking."
    },
    {
      icon: Shield,
      title: "Compliance Management",
      description: "Automated tracking of regulatory requirements, inspection schedules, and documentation management."
    },
    {
      icon: FileSpreadsheet,
      title: "Cost Tracking & Analysis",
      description: "Detailed cost tracking for vehicles, including acquisition, maintenance, fuel, and depreciation with customizable reporting."
    },
    {
      icon: Cpu,
      title: "AI-Powered Optimization",
      description: "Machine learning algorithms optimize routes, predict maintenance needs, and identify cost-saving opportunities."
    }
  ];

  // Case Study Data
  const caseStudy = {
    company: "Agave Environmental Contracting Inc.",
    logo: "/images/agave-logo.png",
    clientUrl: "https://www.agave-inc.com/",
    challenge: "Managing a growing fleet of over 300 vehicles across multiple locations with increasing administrative overhead and maintenance costs.",
    solution: "Implemented a comprehensive AI-powered fleet management system with real-time tracking, automated maintenance scheduling, and predictive analytics.",
    results: [
      {
        icon: Clock,
        value: "2,500+",
        label: "Annual Labor Hours Saved"
      },
      {
        icon: TrendingUp,
        value: "22%",
        label: "Maintenance Cost Reduction"
      },
      {
        icon: BarChart,
        value: "15%",
        label: "Overall Fleet Efficiency Increase"
      }
    ]
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: "Reduced Operating Costs",
      description: "Cut fleet operating costs by optimizing routes, improving maintenance scheduling, and reducing fuel consumption."
    },
    {
      icon: Clock,
      title: "Increased Productivity",
      description: "Automate administrative tasks and streamline workflows to free up staff time for higher-value activities."
    },
    {
      icon: Shield,
      title: "Enhanced Safety & Compliance",
      description: "Ensure regulatory compliance and improve safety with automatic alerts, inspections tracking, and driver behavior monitoring."
    },
    {
      icon: LineChart,
      title: "Data-Driven Decisions",
      description: "Make informed fleet decisions with comprehensive analytics and customizable reporting."
    }
  ];

  // Timeline for implementation
  const implementationTimeline = [
    {
      title: "Assessment & Planning",
      description: "We analyze your current fleet management processes, identify pain points, and develop a custom implementation plan.",
      duration: "2-3 weeks"
    },
    {
      title: "System Configuration",
      description: "Our team configures the software to match your specific fleet management needs and integrates with your existing systems.",
      duration: "2-4 weeks"
    },
    {
      title: "Deployment & Training",
      description: "We deploy the system and provide comprehensive training for your team to ensure a smooth transition.",
      duration: "1-2 weeks"
    },
    {
      title: "Ongoing Support & Optimization",
      description: "Continuous support and regular system updates to ensure your fleet management solution evolves with your business needs.",
      duration: "Ongoing"
    }
  ];

  return (
    <div className="container py-12 space-y-20">
      {/* Hero Section */}
      <motion.section 
        className="text-center space-y-6"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <Badge className="px-4 py-1 rounded-full">Fleet Management System</Badge>
        <h1 className="text-4xl md:text-5xl font-bold">Streamline Your Fleet Operations with AI-Powered Intelligence</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Optimize vehicle management, reduce costs, and enhance operational efficiency with our comprehensive fleet management solution.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/get-started">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </motion.section>

      {/* Gallery Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">System Overview</h2>
          <p className="text-muted-foreground">
            Explore our comprehensive fleet management solution
          </p>
        </div>

        <motion.div 
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {galleryImages.map((image, idx) => (
            <Dialog key={idx}>
              <DialogTrigger asChild>
                <div 
                  className="relative overflow-hidden rounded-xl border border-border/40 shadow-sm bg-card/50 transition-all duration-300 hover:shadow-md group cursor-pointer"
                  onClick={() => setSelectedImage(image.src)}
                >
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={image.src} 
                      alt={image.alt} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        console.error(`Failed to load image: ${image.src}`);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="text-white h-10 w-10" />
                  </div>
                  <div className="p-4 bg-background/90 backdrop-blur-sm">
                    <h3 className="font-medium text-lg">{image.title}</h3>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden p-1">
                <div className="relative h-full">
                  <DialogClose className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white">
                    <Maximize2 className="h-5 w-5" />
                  </DialogClose>
                  <img 
                    src={image.src} 
                    alt={image.alt} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error(`Failed to load large image: ${image.src}`);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Comprehensive Fleet Management Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our fleet management system provides all the tools you need to manage your fleet efficiently
          </p>
        </div>

        <motion.div 
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <Card key={idx} className="border-border/40 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="bg-primary/10 rounded-full p-2 inline-block mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </motion.section>

      {/* AI Benefits Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="mb-4">AI-POWERED</Badge>
          <h2 className="text-3xl font-bold">The Power of AI in Fleet Management</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our solution leverages artificial intelligence to transform your fleet operations
          </p>
        </div>

        <motion.div 
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card className="border-border/40 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6">
              <h3 className="text-2xl font-bold mb-4">Predictive Maintenance</h3>
              <p className="text-muted-foreground mb-6">
                AI algorithms analyze vehicle data to predict maintenance needs before failures occur, reducing downtime and costly repairs.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Early detection of potential issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Optimized maintenance scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Reduced unexpected breakdowns</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="border-border/40 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6">
              <h3 className="text-2xl font-bold mb-4">Route Optimization</h3>
              <p className="text-muted-foreground mb-6">
                Advanced AI algorithms analyze traffic patterns, delivery requirements, and vehicle capabilities to determine the most efficient routes.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Reduced fuel consumption</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Improved delivery times</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Dynamic adjustment to real-time conditions</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="border-border/40 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6">
              <h3 className="text-2xl font-bold mb-4">Driver Behavior Analysis</h3>
              <p className="text-muted-foreground mb-6">
                AI monitors and analyzes driver behavior to improve safety, reduce fuel consumption, and identify training opportunities.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Reduced accident rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Lower insurance premiums</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Targeted driver coaching</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="border-border/40 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6">
              <h3 className="text-2xl font-bold mb-4">Intelligent Reporting</h3>
              <p className="text-muted-foreground mb-6">
                AI transforms fleet data into actionable insights with customizable dashboards and automated reporting.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Automated compliance reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Customizable KPI dashboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Trend analysis and forecasting</span>
                </li>
              </ul>
            </div>
          </Card>
        </motion.div>
      </motion.section>

      {/* Case Study Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <Badge variant="outline" className="mb-4">SUCCESS STORY</Badge>
          <h2 className="text-3xl font-bold">Client Success: {caseStudy.company}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how our fleet management solution transformed operations for a leading environmental contracting company
          </p>
        </div>

        <motion.div variants={fadeIn}>
          <Card className="border-border/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <a 
                    href={caseStudy.clientUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center hover:opacity-80 transition-opacity"
                  >
                    <div className="h-16 bg-primary/5 rounded px-4 flex items-center">
                      <img 
                        src={caseStudy.logo} 
                        alt={`${caseStudy.company} logo`} 
                        className="h-full object-contain" 
                        onError={(e) => {
                          console.error("Failed to load logo:", caseStudy.logo);
                          (e.target as HTMLImageElement).style.display = 'none';
                          const element = document.createElement('div');
                          element.className = "flex items-center gap-2";
                          element.innerHTML = `
                            <Building className="h-5 w-5 text-primary" />
                            <span className="font-medium">${caseStudy.company}</span>
                          `;
                          (e.target as HTMLImageElement).parentNode?.appendChild(element);
                        }}
                      />
                    </div>
                    <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="grid grid-cols-3 gap-6">
                  {caseStudy.results.map((result, idx) => (
                    <div key={idx} className="text-center">
                      <div className="font-bold text-2xl text-primary">{result.value}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <result.icon className="h-3 w-3" />
                        <span>{result.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">The Challenge</h3>
                  <p className="text-muted-foreground">{caseStudy.challenge}</p>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Our Solution</h3>
                  <p className="text-muted-foreground">{caseStudy.solution}</p>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Key Improvements</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CarFront className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Centralized vehicle tracking and management</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Automated maintenance scheduling</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Car className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Reduced vehicle downtime by 34%</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Streamlined compliance reporting</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Improved driver safety and accountability</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CalendarCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Enhanced resource scheduling and allocation</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Business Benefits</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The strategic advantages our fleet management solution brings to your business
          </p>
        </div>

        <motion.div 
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {benefits.map((benefit, idx) => (
            <Card key={idx} className="border-border/40 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="bg-primary/10 rounded-full p-2 inline-block mb-2">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </motion.section>

      {/* Implementation Timeline */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Implementation Process</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our streamlined approach to implementing your fleet management solution
          </p>
        </div>

        <motion.div 
          variants={fadeIn}
          className="relative"
        >
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-border/60"></div>
          
          {implementationTimeline.map((step, idx) => (
            <div 
              key={idx} 
              className={`relative flex flex-col md:flex-row items-center md:items-start mb-12 last:mb-0 ${
                idx % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className={`md:w-1/2 px-4 ${idx % 2 === 0 ? 'md:text-right' : ''}`}>
                <div className="rounded-lg bg-card p-6 border border-border/40 shadow-sm md:mr-6 md:ml-0">
                  <div className="font-bold text-xl mb-2">{step.title}</div>
                  <div className="text-sm text-muted-foreground mb-4">{step.description}</div>
                  <Badge variant="outline">{step.duration}</Badge>
                </div>
              </div>
              
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border-4 border-primary z-10">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-bold">{idx + 1}</span>
                </div>
              </div>
              
              <div className="md:w-1/2"></div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.div 
        className="text-center bg-primary/5 rounded-2xl p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Fleet Operations?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Contact us today to learn how our fleet management solution can transform your operations and drive significant cost savings.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/get-started">Request Demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/services/custom-solutions">View More Solutions</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}