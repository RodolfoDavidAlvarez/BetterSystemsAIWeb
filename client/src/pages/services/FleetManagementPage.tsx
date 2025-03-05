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
  Bell,
  PieChart,
  ChartBar,
  Filter
} from 'lucide-react';

import { ExpandableImage } from '@/components/ui/expandable-image';

import { fadeIn, staggerChildren } from '../../lib/animations';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogClose, DialogTrigger } from "../../components/ui/dialog";

export default function FleetManagementPage() {
  // State for image zoom
  const [zoomLevels, setZoomLevels] = useState<Record<number, number>>({});
  
  // State for the active images in different sections
  const [activeRepairImage, setActiveRepairImage] = useState<number>(0);
  const [activeAgaveImage, setActiveAgaveImage] = useState<number>(0);
  const [activeMechanicImage, setActiveMechanicImage] = useState<number>(0);
  
  // Mechanic dashboard images
  const mechanicDashboardImages = [
    {
      src: "/images/mechanic-dashboard/dashboard-main.png",
      alt: "Mechanic dashboard showing vehicle information, AI description, and emergency status",
      title: "Vehicle Information Dashboard"
    },
    {
      src: "/images/mechanic-dashboard/timestamp-tracking.png",
      alt: "Timestamp tracking for repair tickets showing status updates and timeline",
      title: "Repair Ticket Tracking"
    }
  ];
  
  // Repair form gallery images
  const repairFormImages = [
    {
      src: "/images/repair-form/mobile-main.png",
      alt: "Mobile repair form interface with language toggle",
      title: "Multilingual Interface"
    },
    {
      src: "/images/repair-form/mobile-upload.png",
      alt: "Mobile form interface for photo uploads",
      title: "Photo Upload Interface"
    },
    {
      src: "/images/repair-form/loading.jpeg",
      alt: "Mobile form loading state",
      title: "Loading State"
    },
    {
      src: "/images/repair-form/submitted.jpeg",
      alt: "Mobile form submission confirmation",
      title: "Confirmation Screen"
    }
  ];
  
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

  // Agave branding gallery images
  const agaveImages = [
    {
      src: "/images/repair-form/agave-1.jpeg",
      alt: "Agave Environmental Contracting branded repair form",
      title: "Branded Interface"
    },
    {
      src: "/images/repair-form/agave-2.jpeg",
      alt: "Agave Environmental Contracting form fields",
      title: "Custom Form Fields"
    },
    {
      src: "/images/repair-form/agave-3.jpeg",
      alt: "Agave Environmental Contracting options",
      title: "Company-Specific Options"
    }
  ];
  
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

      {/* Mechanic Dashboard Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20 overflow-hidden bg-slate-900 text-white py-16"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Mechanic Dashboard</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Our mechanic dashboard presents all repair information in an intuitive format, including AI-classified descriptions, 
              priority status indicators, and detailed repair tracking.
            </p>
          </div>

          {/* Main Display with Image Carousel */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16 mb-16"
          >
            {/* Main Image Display */}
            <div className="flex-1 max-w-xl">
              <div className="relative rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden">
                <ExpandableImage 
                  src={mechanicDashboardImages[activeMechanicImage].src} 
                  alt={mechanicDashboardImages[activeMechanicImage].alt} 
                  containerClassName="cursor-pointer"
                />
              </div>
              <h3 className="text-xl font-bold text-center mt-6 mb-2">
                {mechanicDashboardImages[activeMechanicImage].title}
              </h3>
            </div>
            
            {/* Dashboard Features */}
            <div className="flex-1 max-w-md">
              <div className="grid grid-cols-1 gap-4 mb-8">
                {mechanicDashboardImages.map((image, idx) => (
                  <button 
                    key={idx}
                    className={`bg-slate-800 rounded-xl overflow-hidden p-4 border-2 transition-all duration-200 ${
                      activeMechanicImage === idx 
                        ? 'border-blue-500 shadow-md shadow-blue-900/30' 
                        : 'border-transparent hover:border-blue-500/50'
                    }`}
                    onClick={() => setActiveMechanicImage(idx)}
                    aria-label={`View ${image.title}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-slate-700 rounded-lg overflow-hidden">
                        <img src={image.src} alt={image.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium mb-1">{image.title}</h4>
                        <p className="text-sm text-gray-400">
                          {idx === 0 ? "AI-classified repairs with priority indicators" : "Complete time tracking for repair lifecycle"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
                <h4 className="font-bold text-blue-300 mb-2">Dashboard Benefits:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Emergency repair prioritization with visual indicators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Complete timeline tracking for maintenance efficiency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Advanced analytics on service times and patterns</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Problem Classification Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20 overflow-hidden bg-slate-800 text-white py-16"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Repair Problem Classification</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Track repair categories and costs with detailed analytics that help identify frequent issues and optimize maintenance budgets.
            </p>
          </div>

          {/* Problem Classification Display */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-12"
          >
            {/* Main Image Display */}
            <div className="flex-1 max-w-4xl">
              <div className="relative rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden">
                <ExpandableImage 
                  src="/images/problem-classification/problem-look.png" 
                  alt="Problem classification graph showing repair categories and costs" 
                  containerClassName="cursor-pointer"
                />
              </div>
            </div>
            
            {/* Problem Classification Features */}
            <div className="flex-1 max-w-md">
              <div className="space-y-6">
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-600 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <PieChart className="h-6 w-6 text-blue-400" /> 
                    Repair Category Breakdown
                  </h3>
                  <p className="text-gray-300">
                    View the distribution of repair types across your fleet, helping identify systemic issues that may require preventative maintenance programs.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-600 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <ChartBar className="h-6 w-6 text-green-400" /> 
                    Cost Analysis
                  </h3>
                  <p className="text-gray-300">
                    Monitor repair costs per category and identify which issues are most expensive, allowing for better budget planning and resource allocation.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-600 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <Filter className="h-6 w-6 text-yellow-400" /> 
                    Customizable Reports
                  </h3>
                  <p className="text-gray-300">
                    Generate tailored reports by department, vehicle type, or time period to gain actionable insights for decision-making and maintenance scheduling.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Service Records Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20 overflow-hidden bg-gradient-to-r from-slate-600 to-slate-700 py-16 text-white"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Complete Service Tracking</h2>
            <p className="text-lg text-slate-200 max-w-3xl mx-auto">
              Track individual service costs, repair descriptions, and cumulative fleet expenses with detailed service records.
            </p>
          </div>

          {/* Main Service Records Display */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-12"
          >
            {/* Main Image Display */}
            <div className="flex-1 max-w-4xl">
              <div className="relative rounded-xl border-2 border-slate-500 shadow-2xl overflow-hidden">
                <ExpandableImage 
                  src="/images/service-records/service-costs.png" 
                  alt="Service records showing repair costs, mechanic assignments, and service details" 
                  containerClassName="cursor-pointer"
                />
              </div>
            </div>
            
            {/* Service Records Features */}
            <div className="flex-1 max-w-md">
              <div className="space-y-6">
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-500 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-400" /> 
                    Cost Tracking
                  </h3>
                  <p className="text-gray-300">
                    Monitor both individual repair expenses and total fleet maintenance costs to optimize your budget and identify trends.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-500 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <Clock className="h-6 w-6 text-green-400" /> 
                    Service History
                  </h3>
                  <p className="text-gray-300">
                    Access complete service history with timestamps, mechanic assignments, and detailed repair descriptions for each vehicle.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-500 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-yellow-400" /> 
                    Actionable Reports
                  </h3>
                  <p className="text-gray-300">
                    Generate custom reports to identify patterns, forecast maintenance costs, and make data-driven decisions for your fleet.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
        className="mb-20 overflow-hidden bg-black text-white py-16"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Mobile Repair Request System</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Our mobile-friendly repair request form makes it easy for drivers to report issues 
              and upload photos directly from their phones, with multilingual support for diverse workforces.
            </p>
          </div>

          {/* Main Display with Image Carousel */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16 mb-16"
          >
            {/* Main Image Display - Large Phone Display */}
            <div className="flex-1 max-w-md">
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[40px] p-3 border-[14px] border-gray-800 shadow-2xl mx-auto max-w-[320px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl"></div>
                <div className="w-full rounded-3xl overflow-hidden aspect-[9/19] bg-[#1e3a4a]">
                  <img 
                    src={repairFormImages[activeRepairImage].src} 
                    alt={repairFormImages[activeRepairImage].alt} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-center mt-6 mb-2">
                {repairFormImages[activeRepairImage].title}
              </h3>
            </div>
            
            {/* Thumbnail Gallery with Features */}
            <div className="flex-1 max-w-md">
              <div className="grid grid-cols-2 gap-4 mb-8">
                {repairFormImages.map((image, idx) => (
                  <button 
                    key={idx}
                    className={`bg-[#1e3a4a] rounded-xl overflow-hidden p-2 border-2 transition-all duration-200 aspect-square flex items-center justify-center ${
                      activeRepairImage === idx 
                        ? 'border-blue-500 shadow-md shadow-blue-900/20' 
                        : 'border-transparent hover:border-blue-500/50'
                    }`}
                    onClick={() => setActiveRepairImage(idx)}
                    aria-label={`View ${image.title}`}
                  >
                    <img 
                      src={image.src} 
                      alt={image.alt} 
                      className="h-full w-auto object-contain max-h-[90%]"
                    />
                  </button>
                ))}
              </div>
              
              {/* Key Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Multilingual Support</h3>
                    <p className="text-gray-400 text-sm">
                      Toggle between English and Spanish to meet the needs of all your drivers
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Photo Documentation</h3>
                    <p className="text-gray-400 text-sm">
                      Upload multiple photos to document issues with visual evidence
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Smooth User Experience</h3>
                    <p className="text-gray-400 text-sm">
                      From loading states to confirmation screens, users always know what's happening
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* Private Label Customization Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20 overflow-hidden bg-gradient-to-r from-emerald-950 to-emerald-900 text-white py-16"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Custom-Branded For Your Business</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Your fleet management system can be fully customized with your company's branding, 
              creating a seamless, professional experience for your team.
            </p>
          </div>

          {/* Agave Examples */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16"
          >
            {/* Main Branded Example */}
            <div className="flex-1 max-w-xl">
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[40px] p-3 border-[14px] border-gray-800 shadow-2xl mx-auto max-w-[340px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl"></div>
                <div className="w-full rounded-3xl overflow-hidden aspect-[9/19] bg-[#1e3a4a]">
                  <img 
                    src={agaveImages[activeAgaveImage].src} 
                    alt={agaveImages[activeAgaveImage].alt} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-center mt-6 mb-2">
                {agaveImages[activeAgaveImage].title}
              </h3>
              
              {/* Image Selection Dots */}
              <div className="flex justify-center space-x-2 mt-4">
                {agaveImages.map((_, idx) => (
                  <button 
                    key={idx}
                    className={`h-3 w-3 rounded-full transition-colors duration-200 ${
                      activeAgaveImage === idx ? 'bg-emerald-400' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    onClick={() => setActiveAgaveImage(idx)}
                    aria-label={`View image ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Branding Description */}
            <div className="flex-1 max-w-xl">
              <h3 className="text-2xl font-bold mb-6">
                Custom-Branded For Your Business
              </h3>
              
              <div className="space-y-6 mb-8">
                <p className="text-gray-300">
                  See how Agave Environmental Contracting has their own branded repair request system, 
                  complete with their logo, colors, and specific fields tailored to their business needs.
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  {agaveImages.map((image, idx) => (
                    <button 
                      key={idx}
                      className={`bg-black/30 rounded-xl overflow-hidden p-2 border-2 transition-all duration-200 aspect-square flex items-center justify-center ${
                        activeAgaveImage === idx 
                          ? 'border-emerald-400 shadow-md shadow-emerald-900/30' 
                          : 'border-transparent hover:border-emerald-400/50'
                      }`}
                      onClick={() => setActiveAgaveImage(idx)}
                      aria-label={`View ${image.title}`}
                    >
                      <img 
                        src={image.src} 
                        alt={image.alt} 
                        className="h-full w-auto object-contain max-h-[90%]"
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl">
                <h4 className="text-xl font-semibold mb-2">Why Customize Your System?</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Strengthen your company identity with consistent branding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Increase user adoption with familiar, intuitive interfaces</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Match terminology and workflows to your specific operations</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Mechanic Dashboard Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20 overflow-hidden bg-slate-900 text-white py-16"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Mechanic Dashboard</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Our mechanic dashboard presents all repair information in an intuitive format, including AI-classified descriptions, 
              priority status indicators, and detailed repair tracking.
            </p>
          </div>

          {/* Main Display with Image Carousel */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16 mb-16"
          >
            {/* Main Image Display */}
            <div className="flex-1 max-w-xl">
              <div className="relative rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden">
                <ExpandableImage 
                  src={mechanicDashboardImages[activeMechanicImage].src} 
                  alt={mechanicDashboardImages[activeMechanicImage].alt} 
                  containerClassName="cursor-pointer"
                />
              </div>
              <h3 className="text-xl font-bold text-center mt-6 mb-2">
                {mechanicDashboardImages[activeMechanicImage].title}
              </h3>
            </div>
            
            {/* Dashboard Features */}
            <div className="flex-1 max-w-md">
              <div className="grid grid-cols-1 gap-4 mb-8">
                {mechanicDashboardImages.map((image, idx) => (
                  <button 
                    key={idx}
                    className={`bg-slate-800 rounded-xl overflow-hidden p-4 border-2 transition-all duration-200 ${
                      activeMechanicImage === idx 
                        ? 'border-blue-500 shadow-md shadow-blue-900/30' 
                        : 'border-transparent hover:border-blue-500/50'
                    }`}
                    onClick={() => setActiveMechanicImage(idx)}
                    aria-label={`View ${image.title}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-slate-700 rounded-lg overflow-hidden">
                        <img src={image.src} alt={image.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium mb-1">{image.title}</h4>
                        <p className="text-sm text-gray-400">
                          {idx === 0 ? "AI-classified repairs with priority indicators" : "Complete time tracking for repair lifecycle"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
                <h4 className="font-bold text-blue-300 mb-2">Dashboard Benefits:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Emergency repair prioritization with visual indicators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Complete timeline tracking for maintenance efficiency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Advanced analytics on service times and patterns</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Problem Classification Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20 overflow-hidden bg-slate-800 text-white py-16"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Repair Problem Classification</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Track repair categories and costs with detailed analytics that help identify frequent issues and optimize maintenance budgets.
            </p>
          </div>

          {/* Problem Classification Display */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-12"
          >
            {/* Main Image Display */}
            <div className="flex-1 max-w-4xl">
              <div className="relative rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden">
                <ExpandableImage 
                  src="/images/problem-classification/problem-look.png" 
                  alt="Problem classification graph showing repair categories and costs" 
                  containerClassName="cursor-pointer"
                />
              </div>
            </div>
            
            {/* Problem Classification Features */}
            <div className="flex-1 max-w-md">
              <div className="space-y-6">
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-600 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <PieChart className="h-6 w-6 text-blue-400" /> 
                    Repair Category Breakdown
                  </h3>
                  <p className="text-gray-300">
                    View the distribution of repair types across your fleet, helping identify systemic issues that may require preventative maintenance programs.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-600 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <ChartBar className="h-6 w-6 text-green-400" /> 
                    Cost Analysis
                  </h3>
                  <p className="text-gray-300">
                    Monitor repair costs per category and identify which issues are most expensive, allowing for better budget planning and resource allocation.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-600 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <Filter className="h-6 w-6 text-yellow-400" /> 
                    Customizable Reports
                  </h3>
                  <p className="text-gray-300">
                    Generate tailored reports by department, vehicle type, or time period to gain actionable insights for decision-making and maintenance scheduling.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Service Records Section */}
      <motion.section
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="mb-20 overflow-hidden bg-gradient-to-r from-slate-600 to-slate-700 py-16 text-white"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Complete Service Tracking</h2>
            <p className="text-lg text-slate-200 max-w-3xl mx-auto">
              Track individual service costs, repair descriptions, and cumulative fleet expenses with detailed service records.
            </p>
          </div>

          {/* Main Service Records Display */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col lg:flex-row justify-center items-center gap-12"
          >
            {/* Main Image Display */}
            <div className="flex-1 max-w-4xl">
              <div className="relative rounded-xl border-2 border-slate-500 shadow-2xl overflow-hidden">
                <ExpandableImage 
                  src="/images/service-records/service-costs.png" 
                  alt="Service records showing repair costs, mechanic assignments, and service details" 
                  containerClassName="cursor-pointer"
                />
              </div>
            </div>
            
            {/* Service Records Features */}
            <div className="flex-1 max-w-md">
              <div className="space-y-6">
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-500 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-400" /> 
                    Cost Tracking
                  </h3>
                  <p className="text-gray-300">
                    Monitor both individual repair expenses and total fleet maintenance costs to optimize your budget and identify trends.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-500 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <Clock className="h-6 w-6 text-green-400" /> 
                    Service History
                  </h3>
                  <p className="text-gray-300">
                    Access complete service history with timestamps, mechanic assignments, and detailed repair descriptions for each vehicle.
                  </p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-5 border border-slate-500 shadow-md">
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-yellow-400" /> 
                    Actionable Reports
                  </h3>
                  <p className="text-gray-300">
                    Generate custom reports to identify patterns, forecast maintenance costs, and make data-driven decisions for your fleet.
                  </p>
                </div>
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