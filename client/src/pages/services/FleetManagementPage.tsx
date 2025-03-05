import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Gauge,
  Timer,
  ArrowLeft,
  BellRing,
  Database,
  FileText,
  Truck,
  CheckCircle2,
  Calendar,
  Clock,
  ClipboardCheck,
  Wrench,
  BarChart3,
  TrendingUp,
  Smartphone,
  MessageSquare,
  Settings,
} from "lucide-react";
import React from "react";
import AutoplayPlugin from "embla-carousel-autoplay";

export default function FleetManagementPage() {
  // Reference for animating elements
  const bellRef = React.useRef<HTMLDivElement>(null);
  const phoneRef = React.useRef<HTMLDivElement>(null);
  const trucksRef = React.useRef<HTMLDivElement>(null);
  
  // Animation effect
  React.useEffect(() => {
    // Notification bell animation
    if (bellRef.current) {
      const bell = bellRef.current;
      const bellAnimation = () => {
        bell.animate([
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(15deg)' },
          { transform: 'rotate(-15deg)' },
          { transform: 'rotate(0deg)' }
        ], {
          duration: 1000,
          iterations: Infinity,
          easing: 'ease-in-out',
          direction: 'alternate',
          delay: 2000,
        });
      };
      bellAnimation();
    }

    // Phone notification animation
    if (phoneRef.current) {
      const phone = phoneRef.current;
      const phoneAnimation = () => {
        phone.animate([
          { transform: 'translateY(0px)' },
          { transform: 'translateY(-10px)' },
          { transform: 'translateY(0px)' }
        ], {
          duration: 1500,
          iterations: Infinity,
          easing: 'ease-in-out',
        });
      };
      phoneAnimation();
    }

    // Trucks animation
    if (trucksRef.current) {
      const trucks = trucksRef.current;
      const trucksAnimation = () => {
        trucks.animate([
          { transform: 'translateX(0px)' },
          { transform: 'translateX(10px)' },
          { transform: 'translateX(0px)' }
        ], {
          duration: 2000,
          iterations: Infinity,
          easing: 'ease-in-out',
        });
      };
      trucksAnimation();
    }
  }, []);

  // Core features with animations
  const coreFeatures = [
    {
      title: "Automated Repairs",
      subtitle: "Save Time With Instant Booking",
      icon: Wrench,
      color: "bg-blue-500",
      description: "When a vehicle needs service, repair requests are automatically sent to drivers and mechanics, eliminating paperwork and manual coordination.",
      animation: "pulse"
    },
    {
      title: "Real-Time Updates",
      subtitle: "Stay Informed Anywhere",
      icon: BellRing,
      color: "bg-green-500",
      description: "Get real-time notifications on repair status and maintenance updates via SMS alerts, so you're always in the loop.",
      ref: bellRef,
      animation: "bounce"
    },
    {
      title: "Centralized Data",
      subtitle: "Everything in One Place",
      icon: Database,
      color: "bg-purple-500",
      description: "Keep all your important fleet information — vehicle details, tire specs, supplier contacts, certifications, and licensing — in one secure location.",
      animation: "fade"
    },
    {
      title: "Smart Scheduling",
      subtitle: "Efficient Coordination",
      icon: Calendar,
      color: "bg-orange-500",
      description: "Quickly find when drivers and vehicles are available, reducing the hassle of coordinating repairs and maintenance.",
      animation: "slide"
    }
  ];
  
  // Statistics and metrics
  const metrics = [
    {
      value: "2,500+",
      label: "Hours Saved Annually",
      description: "Labor hours saved managing driver, vehicle, and incident information.",
      icon: Clock
    },
    {
      value: "300+",
      label: "Vehicles Managed",
      description: "Fleet size successfully managed with our system.",
      icon: Truck,
      ref: trucksRef
    },
    {
      value: "60%",
      label: "Faster Responses",
      description: "Improvement in maintenance response times.",
      icon: Timer
    }
  ];

  // Benefits carousel items  
  const benefits = [
    {
      title: "Instant Repair Booking",
      icon: Smartphone,
      ref: phoneRef,
      description: "Drivers report issues directly from their phones, and work orders are automatically created and dispatched."
    },
    {
      title: "Monthly Checkups",
      icon: ClipboardCheck,
      description: "Automated mileage and performance checks help you quickly spot issues and plan preventative maintenance."
    },
    {
      title: "Easy Communication",
      icon: MessageSquare,
      description: "SMS alerts keep everyone informed without having to check multiple systems or make phone calls."
    },
    {
      title: "Track Repairs & Maintenance",
      icon: FileText,
      description: "Know exactly when each vehicle was last serviced and what work was performed."
    },
    {
      title: "Performance Analytics",
      icon: BarChart3,
      description: "Detailed analysis helps you identify reliable vehicles and make informed purchasing decisions."
    }
  ];

  return (
    <div className="container mx-auto px-4 pb-16">
      {/* Hero Section with Visual Impact */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 to-primary/20 p-8 pt-16 md:p-16 mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 max-w-4xl">
          {/* Navigation */}
          <div className="mb-8">
            <Link href="/services/custom-solutions" className="inline-flex items-center text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Custom Solutions
            </Link>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Fleet Management <br/><span className="text-primary">Made Simple</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
            Imagine having all your fleet information in one place. Our system makes it easy to track vehicles, drivers, and repairs so you can save time, reduce downtime, and keep your trucks on the road.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/get-started">
                Get Started <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics with Animations */}
      <motion.section 
        className="mb-16"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <div className="grid md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <motion.div 
              key={index} 
              variants={fadeIn}
              className="bg-primary/5 rounded-2xl p-8 text-center relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              <div className="relative z-10">
                <div ref={metric.ref} className="mx-auto mb-4 p-4 rounded-full bg-primary/10 inline-block">
                  <metric.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold mb-2 text-foreground">{metric.value}</div>
                <div className="font-semibold mb-2 text-primary">{metric.label}</div>
                <p className="text-muted-foreground">{metric.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-6 text-muted-foreground">
          <p>Developed for the largest landscaping company in Arizona</p>
        </div>
      </motion.section>

      {/* Core Features with Visual Elements */}
      <motion.section 
        className="mb-16"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our fleet management system simplifies every aspect of your operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {coreFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              variants={fadeIn}
              className="rounded-2xl bg-gradient-to-br from-background to-muted/30 p-1 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-background rounded-xl p-8 h-full flex flex-col">
                <div className="flex items-start mb-6">
                  <div ref={feature.ref} className={`p-3 rounded-lg ${feature.color} text-white mr-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{feature.title}</h3>
                    <p className="text-primary font-medium">{feature.subtitle}</p>
                  </div>
                </div>
                <p className="text-muted-foreground flex-grow">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Benefits Carousel */}
      <motion.section 
        className="mb-16"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Better Decisions, Better Results</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Make informed choices about your fleet with powerful features
          </p>
        </div>
        
        <Carousel 
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            AutoplayPlugin({
              delay: 4000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {benefits.map((benefit, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                <div className="bg-primary/5 rounded-2xl p-8 h-full flex flex-col hover:bg-primary/10 transition-colors duration-300">
                  <div className="mb-6 flex items-center">
                    <div ref={index === 0 ? benefit.ref : undefined} className="bg-primary/20 p-4 rounded-full mr-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{benefit.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-8">
            <CarouselPrevious className="relative static translate-y-0 left-0" />
            <CarouselNext className="relative static translate-y-0 right-0" />
          </div>
        </Carousel>
      </motion.section>

      {/* Real Customer Highlight */}
      <motion.section
        className="mb-16 bg-primary/5 rounded-2xl p-8 md:p-12 relative overflow-hidden"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-4xl text-primary mb-4">❝</div>
          <p className="text-xl md:text-2xl italic mb-6">
            Better Systems AI's Fleet Management System has revolutionized how we handle our vehicle maintenance. 
            The automation and real-time insights have been game-changing for our operations.
          </p>
          <div className="flex items-center">
            <div className="bg-primary/20 rounded-full p-2 mr-4">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium">Operations Director, Agave Environmental Contract, Inc</p>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-4">Get Started Today</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Streamline your fleet operations, reduce costs, and enjoy more time to focus on growing your business. 
          Ready to make fleet management effortless? Reach out to us and take control of your fleet today!
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/get-started">
              Request Demo <TrendingUp className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
}