import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Clock, 
  Truck, 
  Timer, 
  ExternalLink 
} from "lucide-react";

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

  const caseStudies = [
    {
      title: "Fleet Management System 2.0",
      company: "Agave Environmental Contracting, Inc.",
      description: "Arizona's largest landscaping company transformed their fleet operations with our custom AI solution. By automating maintenance scheduling, improving communication, and implementing real-time tracking, we helped save 2,500+ labor hours annually while managing 300+ vehicles.",
      metrics: [
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
          icon: Truck
        },
        {
          value: "60%",
          label: "Faster Responses",
          description: "Improvement in maintenance response times.",
          icon: Timer
        }
      ],
      logo: "/images/agave-logo.png",
      clientUrl: "https://www.agave-inc.com/",
      image: "/images/fleet-management-preview.png",
      link: "/services/fleet-management",
      galleryImages: [
        "/images/ai-classification-gallery.png",
        "/images/cost-analysis-reporting.png",
        "/images/driver-management.png",
        "/images/vehicle-management-detail.png"
      ],
      highlights: [
        "AI-powered problem classification",
        "Real-time SMS notification system",
        "Comprehensive analytics dashboard",
        "Automated maintenance scheduling",
        "Driver information management",
        "Cost reduction reporting"
      ]
    }
    // Add more case studies here as needed
  ];

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

        {/* Success Stories Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Success Stories</h2>
          <div className="grid gap-8">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-border/40 bg-gradient-to-b from-muted/50 to-transparent">
                  <CardContent className="p-8 relative">
                    <div className="grid md:grid-cols-5 gap-8 items-start">
                      <div className="relative md:col-span-3">
                        <div className="absolute -left-3 top-0 w-1 h-full bg-primary/30 rounded" />
                        
                        {/* Title and Client Info */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                          <div>
                            <h3 className="text-2xl font-semibold mb-1">{study.title}</h3>
                            <p className="text-sm text-muted-foreground">{study.company}</p>
                          </div>
                          <div className="flex items-center ml-auto">
                            {study.logo && (
                              <a 
                                href={study.clientUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center hover:opacity-80 transition-opacity"
                              >
                                <img 
                                  src={study.logo} 
                                  alt={`${study.company} logo`} 
                                  className="h-12 object-contain" 
                                />
                                <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground" />
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {/* Description */}
                        <div className="bg-card/50 rounded-lg p-4 mb-6 border border-border/30">
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Success Story: </span>
                            {study.description}
                          </p>
                        </div>
                        
                        {/* Key Metrics */}
                        {study.metrics && (
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            {study.metrics.map((metric, idx) => (
                              <div 
                                key={idx} 
                                className="bg-primary/5 rounded-lg p-4 text-center relative overflow-hidden hover:bg-primary/10 transition-all duration-300"
                              >
                                <div className="mx-auto mb-2 p-2 rounded-full bg-primary/10 inline-block">
                                  <metric.icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-2xl font-bold mb-1 text-foreground">{metric.value}</div>
                                <div className="text-xs font-medium text-primary">{metric.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Features/Highlights */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Key Features:</h4>
                          <ul className="grid grid-cols-2 gap-2 mb-6">
                            {study.highlights.map((highlight, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <span className="size-1.5 rounded-full bg-primary/60" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* CTA Button */}
                        <Button asChild className="group">
                          <Link href={study.link}>
                            View Full Case Study
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                      
                      {/* Gallery Preview */}
                      <div className="md:col-span-2 space-y-4">
                        {study.galleryImages && study.galleryImages.length > 0 && (
                          <div className="space-y-4">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                              <img 
                                src={study.galleryImages[0]} 
                                alt="System screenshot" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {study.galleryImages.slice(1, 4).map((img, idx) => (
                                <div key={idx} className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                                  <img 
                                    src={img} 
                                    alt={`System screenshot ${idx + 2}`} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                              Click "View Full Case Study" to see more screenshots
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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