import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useState } from 'react';
import { 
  Clock, 
  BarChart, 
  FileSpreadsheet,
  Maximize2,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  Truck,
  BarChart3,
  Clock4,
  Bell
} from 'lucide-react';

import { fadeIn, staggerChildren } from '../../lib/animations';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogClose, DialogTrigger } from "../../components/ui/dialog";

export default function FleetManagementPage() {
  // State for image zoom
  const [zoomLevels, setZoomLevels] = useState<Record<number, number>>({});
  
  // Function to handle zooming in/out
  const handleZoom = (idx: number, action: 'in' | 'out') => {
    setZoomLevels(prev => {
      const currentZoom = prev[idx] || 1;
      const newZoom = action === 'in' 
        ? Math.min(currentZoom + 0.25, 3) // Max zoom: 3x
        : Math.max(currentZoom - 0.25, 0.5); // Min zoom: 0.5x
      return { ...prev, [idx]: newZoom };
    });
  };

  // Reset zoom when dialog is closed
  const resetZoom = (idx: number) => {
    setZoomLevels(prev => ({ ...prev, [idx]: 1 }));
  };

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
      icon: Clock,
      title: "Save Time With Automated Repairs",
      description: "When a vehicle needs service, repair requests are automatically sent to the right driver and mechanic, with smart scheduling to reduce coordination hassle.",
      points: [
        "Instant Repair Booking",
        "Smart Scheduling"
      ]
    },
    {
      icon: FileSpreadsheet,
      title: "Centralized Data Management",
      description: "Keep all your vehicle details, tire information, supplier contacts, and certifications in one secure location with automated monthly checkups.",
      points: [
        "Unified Records",
        "Monthly Checkups"
      ]
    },
    {
      icon: Bell,
      title: "Real-Time Updates & Notifications",
      description: "Get real-time notifications on repair status and maintenance updates with SMS alerts to stay informed without checking multiple systems.",
      points: [
        "Up-to-Date Information",
        "Easy Communication"
      ]
    },
    {
      icon: BarChart3,
      title: "Better Decisions, Better Results",
      description: "Track repair requests and maintenance history while detailed analysis helps you make informed decisions about vehicle replacement.",
      points: [
        "Track Repairs & Maintenance",
        "Informed Purchases"
      ]
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
        <h1 className="text-4xl md:text-5xl font-bold">Keep Your Fleet Running Smoothly</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Imagine having all your fleet information in one place. Our system makes it easy to track vehicles, drivers, and repairs so you can save time, reduce downtime, and keep your trucks on the road.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/get-started">Get Started Today</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Request Demo</Link>
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
              <DialogContent 
                className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden p-1"
                onInteractOutside={() => resetZoom(idx)}
                onEscapeKeyDown={() => resetZoom(idx)}
              >
                <div className="relative h-full overflow-auto">
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button 
                      onClick={() => handleZoom(idx, 'in')}
                      className="bg-black/20 hover:bg-black/40 p-2 rounded-full text-white transition-colors"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleZoom(idx, 'out')}
                      className="bg-black/20 hover:bg-black/40 p-2 rounded-full text-white transition-colors"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="h-5 w-5" />
                    </button>
                    <DialogClose 
                      className="bg-black/20 hover:bg-black/40 p-2 rounded-full text-white transition-colors"
                      onClick={() => resetZoom(idx)}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </DialogClose>
                  </div>
                  <div 
                    className="w-full h-full min-h-[50vh] flex items-center justify-center overflow-auto"
                    style={{ cursor: (zoomLevels[idx] || 1) > 1 ? 'move' : 'default' }}
                  >
                    <img 
                      src={image.src} 
                      alt={image.alt} 
                      className="transition-transform duration-200 ease-out"
                      style={{ 
                        transform: `scale(${zoomLevels[idx] || 1})`,
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                      onError={(e) => {
                        console.error(`Failed to load large image: ${image.src}`);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {Math.round((zoomLevels[idx] || 1) * 100)}% | Click and drag to move
                  </div>
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
        className="mb-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={fadeIn}
              whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.1)" }}
              className="bg-card rounded-lg p-6 border border-border/40 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-full p-3 flex-shrink-0 mt-1">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="mb-20 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Fleet Management Benefits</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our fleet management system helps you streamline operations, reduce costs, and focus on growing your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
              <Clock4 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Time Savings</h3>
            <p className="text-muted-foreground">
              Automated workflows and instant notifications save your team valuable time on administrative tasks.
            </p>
          </div>
          
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Reduced Downtime</h3>
            <p className="text-muted-foreground">
              Proactive maintenance scheduling and faster repairs keep your vehicles on the road longer.
            </p>
          </div>
          
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
              <BarChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Better Decisions</h3>
            <p className="text-muted-foreground">
              Detailed analytics and reports help you make informed decisions about your fleet investments.
            </p>
          </div>
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

      {/* Repair Request Form Showcase */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Digital Repair Request System</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our mobile-friendly repair request form makes it easy for drivers to report vehicle issues instantly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div 
            variants={fadeIn}
            className="flex flex-col justify-center"
          >
            <h3 className="text-2xl font-semibold mb-4">Streamlined Repair Workflow</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Multilingual Support</p>
                  <p className="text-muted-foreground">Toggle between English and Spanish to support diverse workforces</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Photo Documentation</p>
                  <p className="text-muted-foreground">Upload multiple photos directly from mobile devices to document issues</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Priority Flagging</p>
                  <p className="text-muted-foreground">Easily mark urgent repairs for immediate attention</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Instant Notifications</p>
                  <p className="text-muted-foreground">Automatically alerts mechanics and managers when new requests are submitted</p>
                </div>
              </li>
            </ul>
          </motion.div>
          
          <motion.div 
            variants={fadeIn}
            className="relative"
          >
            <div className="relative mx-auto w-[280px] md:w-[320px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-[#1e394a] rounded-[40px] shadow-xl transform rotate-2 scale-[1.01] z-0"></div>
              
              {/* Main Image */}
              <div className="relative bg-white rounded-[36px] overflow-hidden shadow-lg z-10">
                <img 
                  src="/images/repair-request-form-1.png" 
                  alt="Mobile view of vehicle repair request form with personal and vehicle information fields" 
                  className="w-full"
                  onError={(e) => {
                    console.error(`Failed to load repair form image`);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              
              {/* Second Image (Smaller & Offset) */}
              <div className="absolute -bottom-16 -right-8 w-[65%] bg-white rounded-[24px] overflow-hidden shadow-lg transform -rotate-3 z-20 border-4 border-white">
                <img 
                  src="/images/repair-request-form-2.png" 
                  alt="Mobile view of the problem description and photo upload section of the repair form" 
                  className="w-full"
                  onError={(e) => {
                    console.error(`Failed to load repair form detail image`);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.div 
        className="text-center bg-primary/5 rounded-2xl p-8 md:p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to make fleet management effortless?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Streamline your fleet operations, reduce costs, and enjoy more time to focus on growing your business. Contact us now for a demo and see how our simple, powerful system can work for you!
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/get-started">Get Started Today</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}