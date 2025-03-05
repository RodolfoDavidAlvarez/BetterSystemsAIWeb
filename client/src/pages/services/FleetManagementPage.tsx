import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
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
  Maximize2,
  ExternalLink
} from 'lucide-react';

import { fadeIn, staggerChildren } from '../../lib/animations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogClose, DialogTrigger } from "../../components/ui/dialog";

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

  // Features with animations
  const features = [
    {
      icon: CarFront,
      title: "Vehicle Tracking & Management",
      description: "Real-time GPS tracking with comprehensive vehicle history, maintenance records, and performance metrics."
    },
    {
      icon: Users,
      title: "Driver Management",
      description: "Complete driver profiles with licensing, training records, and safety scores."
    },
    {
      icon: Clipboard,
      title: "Maintenance Scheduling",
      description: "Automated maintenance alerts based on mileage and engine hours with work order creation."
    },
    {
      icon: Shield,
      title: "Compliance Management",
      description: "Automated tracking of regulatory requirements and inspection schedules."
    },
    {
      icon: FileSpreadsheet,
      title: "Cost Tracking & Analysis",
      description: "Detailed cost tracking for acquisition, maintenance, fuel, and depreciation."
    },
    {
      icon: Cpu,
      title: "AI-Powered Optimization",
      description: "Machine learning algorithms that optimize routes and predict maintenance needs."
    }
  ];

  // AI Benefits
  const aiBenefits = [
    {
      title: "Predictive Maintenance",
      description: "AI algorithms analyze vehicle data to predict maintenance needs before failures occur.",
      benefits: [
        "Early detection of potential issues",
        "Optimized maintenance scheduling",
        "Reduced unexpected breakdowns"
      ]
    },
    {
      title: "Route Optimization",
      description: "Advanced algorithms analyze traffic patterns to determine the most efficient routes.",
      benefits: [
        "Reduced fuel consumption",
        "Improved delivery times",
        "Dynamic adjustment to conditions"
      ]
    },
    {
      title: "Driver Behavior Analysis",
      description: "AI monitors driver behavior to improve safety and reduce fuel consumption.",
      benefits: [
        "Reduced accident rates",
        "Lower insurance premiums",
        "Targeted driver coaching"
      ]
    }
  ];

  // Business benefits
  const businessBenefits = [
    {
      icon: TrendingUp,
      title: "Reduced Costs",
      description: "Cut fleet operating costs by optimizing routes and reducing fuel consumption."
    },
    {
      icon: Clock,
      title: "Increased Productivity",
      description: "Automate administrative tasks and streamline workflows for your team."
    },
    {
      icon: Shield,
      title: "Enhanced Compliance",
      description: "Ensure regulatory compliance with automatic alerts and inspections tracking."
    },
    {
      icon: BarChart,
      title: "Data-Driven Decisions",
      description: "Make informed fleet decisions with comprehensive analytics and reporting."
    }
  ];

  // Case Study
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
    <div className="container py-12 px-4">
      {/* Hero Section */}
      <motion.section 
        className="text-center space-y-6 mb-16"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold">Fleet Management System</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Optimize vehicle management, reduce costs, and enhance operational efficiency with our comprehensive fleet management solution.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
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
        className="mb-20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">System Overview</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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

      {/* Case Study Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20"
      >
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">SUCCESS STORY</Badge>
          <h2 className="text-3xl font-bold mb-2">Client Success: {caseStudy.company}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how our fleet management solution transformed operations for a leading environmental contracting company
          </p>
        </div>

        <motion.div variants={fadeIn}>
          <Card className="border-border/40 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className="md:flex-1">
                  <div className="flex items-center gap-4 mb-4">
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
                          }}
                        />
                      </div>
                      <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                  <h3 className="text-xl font-medium mb-2">The Challenge</h3>
                  <p className="text-muted-foreground mb-4">
                    {caseStudy.challenge}
                  </p>
                  <h3 className="text-xl font-medium mb-2">Our Solution</h3>
                  <p className="text-muted-foreground">
                    {caseStudy.solution}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center w-full md:w-auto">
                  <div className="grid grid-cols-3 gap-4">
                    {caseStudy.results.map((result, idx) => (
                      <div key={idx} className="bg-primary/5 rounded-lg p-4 text-center">
                        <div className="bg-background/80 rounded-full p-2 w-10 h-10 flex items-center justify-center mx-auto mb-2">
                          <result.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-2xl font-bold">{result.value}</div>
                        <div className="text-xs text-muted-foreground">{result.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
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
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Key Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our fleet management system provides all the tools you need to manage your fleet efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={fadeIn}
              whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.1)" }}
              className="bg-card rounded-lg p-6 border border-border/40 transition-all duration-300"
            >
              <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* AI Benefits Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20"
      >
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">AI-POWERED</Badge>
          <h2 className="text-3xl font-bold mb-2">The Power of AI in Fleet Management</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our solution leverages artificial intelligence to transform your fleet operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiBenefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              variants={fadeIn}
              className="bg-gradient-to-b from-primary/10 to-primary/5 rounded-lg p-6 border border-border/40"
            >
              <h3 className="text-xl font-medium mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground mb-4">{benefit.description}</p>
              <ul className="space-y-2">
                {benefit.benefits.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Business Benefits Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Business Benefits</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The strategic advantages our fleet management solution brings to your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessBenefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              variants={fadeIn}
              whileHover={{ y: -5 }}
              className="bg-card rounded-lg p-6 border border-border/40 transition-all duration-300 text-center"
            >
              <div className="bg-primary/10 rounded-full p-3 inline-block mb-4 mx-auto">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Implementation Timeline */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Implementation Process</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
                <motion.div 
                  className="rounded-lg bg-card p-6 border border-border/40 shadow-sm md:mr-6 md:ml-0"
                  variants={fadeIn}
                >
                  <div className="font-bold text-xl mb-2">{step.title}</div>
                  <div className="text-sm text-muted-foreground mb-4">{step.description}</div>
                  <Badge variant="outline">{step.duration}</Badge>
                </motion.div>
              </div>
              
              <motion.div 
                className="hidden md:block absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border-4 border-primary z-10"
                variants={fadeIn}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-bold">{idx + 1}</span>
                </div>
              </motion.div>
              
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