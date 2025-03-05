import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  TrendingUp, 
  Clock, 
  BarChart, 
  Shield, 
  Cpu, 
  CarFront, 
  Users, 
  Clipboard, 
  FileSpreadsheet,
  Maximize2,
  ExternalLink
} from 'lucide-react';

import { fadeIn, staggerChildren } from '../../lib/animations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogClose, DialogTrigger } from "../../components/ui/dialog"

export default function FleetManagementPage() {
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
    <div className="container mx-auto py-12 px-4">
      <motion.div 
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">Fleet Management System</h1>
        <p className="text-xl text-muted-foreground">
          Optimize vehicle management, reduce costs, and enhance operational efficiency with our comprehensive fleet management solution.
        </p>
      </motion.div>

      {/* Hero Banner */}
      <motion.section 
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="mb-16"
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <Badge className="mb-4">SUCCESS STORY</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                How {caseStudy.company} Transformed Their Fleet Operations
              </h2>
              <p className="text-muted-foreground mb-6">
                {caseStudy.challenge}
              </p>
              <div className="flex flex-wrap gap-6 mb-6">
                {caseStudy.results.map((result, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="bg-background rounded-full p-2 h-10 w-10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <result.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-xl">{result.value}</div>
                      <div className="text-xs text-muted-foreground">{result.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild>
                <a 
                  href={caseStudy.clientUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  Visit Client Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-center max-w-[200px] mx-auto md:mx-0">
              <img 
                src={caseStudy.logo} 
                alt={`${caseStudy.company} logo`} 
                className="w-full h-auto object-contain rounded-lg bg-white/90 p-4 shadow-md"
                onError={(e) => {
                  console.error("Failed to load logo:", caseStudy.logo);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Gallery Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-16"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">System Overview</h2>
          <p className="text-muted-foreground">
            Our fleet management solution provides a comprehensive view of your entire operation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {galleryImages.map((image, idx) => (
            <Dialog key={idx}>
              <DialogTrigger asChild>
                <div 
                  className="relative overflow-hidden rounded-xl border border-border/40 shadow-sm bg-card/50 transition-all duration-300 hover:shadow-md group cursor-pointer"
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
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-16"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Key Features</h2>
          <p className="text-muted-foreground">
            Our fleet management system provides all the tools you need to manage your fleet efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </motion.section>

      {/* Implementation Timeline */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-16"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Implementation Process</h2>
          <p className="text-muted-foreground">
            Our streamlined approach to implementing your fleet management solution
          </p>
        </div>

        <div className="relative">
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
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.div 
        className="text-center bg-primary/5 rounded-2xl p-8 md:p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Fleet Operations?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Contact us today to learn how our fleet management solution can transform your operations and drive significant cost savings.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
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