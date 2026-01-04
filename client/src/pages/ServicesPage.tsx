import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import {
  ArrowRight,
  Check,
  Zap,
  Shield,
  Rocket,
  Star,
  TrendingUp,
  Workflow,
  MessageSquare,
  Headphones,
  Code2,
  ClipboardCheck,
  Calendar
} from "lucide-react";

export default function ServicesPage() {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      icon: Workflow,
      title: "AI Business Integration",
      subtitle: "Seamlessly integrate AI into your operations",
      description: "Transform your entire business operation. We eliminate bottlenecks, automate repetitive tasks, and give you your time back. AI that actually works for your business.",
      features: [
        "Complete process automation that delivers results",
        "Reduce manual tasks by up to 90%",
        "Custom AI trained on your specific workflows",
        "24/7 automated operations"
      ],
      pricing: "Custom Pricing",
      cta: "Get Started",
      color: "from-primary to-secondary",
      stat: "20+",
      statLabel: "Hours Saved Weekly",
      badge: "MOST POPULAR"
    },
    {
      icon: MessageSquare,
      title: "Automation Consultation",
      subtitle: "Discover what's possible for your business",
      description: "A focused session to identify exactly where automation can save you time and money. We'll map out your processes and show you the opportunities.",
      features: [
        "Deep dive into your current workflows",
        "Custom automation roadmap",
        "Clear cost savings projections",
        "No obligation, pure value"
      ],
      pricing: "Complimentary",
      cta: "Book Consultation",
      color: "from-accent to-primary",
      stat: "$50K+",
      statLabel: "Average Savings Identified",
      badge: "START HERE",
      calendly: true
    },
    {
      icon: Headphones,
      title: "AI Virtual Assistants",
      subtitle: "Pre-built solutions ready to deploy",
      description: "Production-ready AI assistants that work from day one. No lengthy setup, no technical headaches. Just results.",
      features: [
        "24/7 customer support automation",
        "Intelligent email management",
        "Automated data entry and processing",
        "Smart scheduling and calendar management"
      ],
      pricing: "Starting at $297/month",
      cta: "See Options",
      color: "from-accent to-primary",
      stat: "40%",
      statLabel: "Time Saved Daily"
    },
    {
      icon: Code2,
      title: "Custom AI Development",
      subtitle: "Built specifically for your business",
      description: "Fully custom AI systems designed around your exact needs. We build solutions that fit your business perfectly - no compromises.",
      features: [
        "Custom workflows matching your processes",
        "Seamless integration with existing tools",
        "Proprietary AI models for your use case",
        "Scalable architecture that grows with you"
      ],
      pricing: "Custom Pricing",
      cta: "Discuss Your Project",
      color: "from-secondary to-accent",
      stat: "90%",
      statLabel: "Cost Reduction"
    },
    {
      icon: ClipboardCheck,
      title: "Process Analysis & Assessment",
      subtitle: "Find your automation opportunities",
      description: "A comprehensive analysis of your business processes to identify every opportunity for AI and automation. Clear roadmap, clear ROI.",
      features: [
        "Complete process documentation",
        "ROI projections for each opportunity",
        "Prioritized implementation roadmap",
        "Quick wins vs. long-term improvements"
      ],
      pricing: "$2,500",
      cta: "Start Assessment",
      color: "from-accent to-primary",
      stat: "200%",
      statLabel: "Average ROI"
    }
  ];

  const benefits = [
    { icon: Zap, title: "Fast Implementation", description: "Get up and running in days, not months" },
    { icon: Shield, title: "Enterprise Security", description: "Bank-level security for your data" },
    { icon: Rocket, title: "Scalable Solutions", description: "Grow without limits as you expand" }
  ];

  return (
    <div className="min-h-screen bg-background py-20 overflow-hidden">
      <SEO 
        title="AI Services - Better Systems AI"
        description="Explore our AI automation services: custom solutions, AI assistants, efficiency assessments, and consulting. Save 90% on operations."
      />
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="blob h-96 w-96 bg-secondary/20 top-20 -right-48"></div>
        <div className="blob h-96 w-96 bg-accent/20 bottom-20 -left-48 animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold mb-8 shadow-xl">
            <Star className="h-5 w-5" />
            AI Solutions That Work
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-none">
            Our
            <span className="block text-gradient text-6xl md:text-7xl lg:text-8xl">Services</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
            From consultation to custom development. <span className="text-primary font-bold">Find the right solution</span> for your business automation needs.
          </p>
        </div>

        {/* Service Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {services.map((service, index) => (
            <Button
              key={index}
              variant={activeService === index ? "default" : "outline"}
              onClick={() => setActiveService(index)}
              className={`flex items-center gap-2 ${activeService === index ? 'shadow-xl' : ''}`}
            >
              <service.icon className="h-4 w-4" />
              {service.title}
            </Button>
          ))}
        </div>

        {/* Active Service Detail */}
        <Card className="mb-16 border-4 border-primary/20 hover:border-primary/40 shadow-3xl bg-white relative overflow-hidden transition-all duration-300">
          {services[activeService].badge && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-black rounded-full shadow-lg z-10">
              {services[activeService].badge}
            </div>
          )}
          <div className={`h-3 bg-gradient-to-r ${services[activeService].color}`}></div>
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-6 mb-8">
                  <div className={`p-5 rounded-2xl bg-gradient-to-br ${services[activeService].color} shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    {React.createElement(services[activeService].icon, {
                      className: "h-10 w-10 text-white"
                    })}
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black leading-tight">{services[activeService].title}</h2>
                    <p className="text-lg font-bold text-primary">{services[activeService].subtitle}</p>
                  </div>
                </div>
                
                <p className="text-xl mb-8 leading-relaxed font-medium">{services[activeService].description}</p>
                
                <ul className="space-y-4 mb-10">
                  {services[activeService].features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="mt-1">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                          <Check className="h-4 w-4 text-white font-bold" />
                        </div>
                      </div>
                      <span className="font-bold text-lg">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  <div>
                    <p className="text-4xl font-black text-gradient mb-2">
                      {services[activeService].pricing}
                    </p>
                  </div>
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary text-white font-black text-xl px-8 py-4 h-16 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all">
                    <Link href={services[activeService].calendly ? "/contact" : "/contact"}>
                      {services[activeService].cta} <ArrowRight className="ml-3 h-6 w-6" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${services[activeService].color} opacity-20 rounded-3xl blur-xl`}></div>
                <div className="relative bg-gradient-to-br from-white to-muted/30 backdrop-blur-sm rounded-3xl p-10 text-center border-4 border-white shadow-2xl">
                  <div className={`text-7xl sm:text-8xl font-black text-gradient mb-6 leading-none`}>
                    {services[activeService].stat}
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-primary mb-6">{services[activeService].statLabel}</p>
                  <div className="mt-8">
                    <div className={`h-20 w-20 mx-auto rounded-full bg-gradient-to-r ${services[activeService].color} flex items-center justify-center shadow-xl`}>
                      <TrendingUp className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-black text-center mb-12">
            Why <span className="text-gradient">Choose Us</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group border-0 bg-gradient-to-br from-white to-muted/20 hover:shadow-2xl hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Process Section */}
        <div className="bg-gradient-to-br from-muted/30 to-transparent rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Simple Process, <span className="text-gradient-primary">Powerful Results</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Discovery", desc: "We analyze your needs" },
              { step: "2", title: "Design", desc: "Custom solution created" },
              { step: "3", title: "Deploy", desc: "Quick implementation" },
              { step: "4", title: "Optimize", desc: "Continuous improvement" }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {index < 3 && (
                  <ArrowRight className="hidden md:block absolute top-6 -right-3 h-4 w-4 text-primary/40" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses already saving time and money with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-primary shadow-xl">
              <Link href="/contact">
                Start Your AI Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/book">
                Book Consultation <Calendar className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
