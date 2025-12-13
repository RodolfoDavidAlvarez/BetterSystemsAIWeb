import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { 
  Bot, 
  Cog, 
  LineChart, 
  Users,
  ArrowRight,
  Check,
  Zap,
  Target,
  Shield,
  Rocket,
  Brain,
  Calendar,
  Star,
  TrendingUp
} from "lucide-react";

export default function ServicesPage() {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      icon: Brain,
      title: "Business Optimization with AI",
      subtitle: "STOP THE CHAOS. START WINNING.",
      description: "Transform your entire business operation. We eliminate the bottlenecks, automate the busywork, and give you your life back. This isn't just AI - it's business DOMINATION.",
      features: [
        "COMPLETE process automation that actually works",
        "ELIMINATE 90% of manual tasks forever",
        "CUSTOM AI that learns YOUR business inside out",
        "24/7 operations while you sleep, vacation, LIVE"
      ],
      pricing: "CUSTOM PRICING",
      cta: "DOMINATE NOW",
      color: "from-primary to-secondary",
      stat: "20+",
      statLabel: "HOURS BACK WEEKLY",
      badge: "MOST POPULAR"
    },
    {
      icon: Calendar,
      title: "FREE AI Consultation",
      subtitle: "ZERO RISK. MAXIMUM INSIGHT.",
      description: "60 minutes that could change EVERYTHING. We'll show you exactly where AI can save you thousands and give you hours back every single week. No sales pitch - just PURE VALUE.",
      features: [
        "DEEP dive into your biggest time wasters",
        "CUSTOM roadmap to AI domination",
        "EXACT cost savings projections",
        "ZERO obligation, 100% value"
      ],
      pricing: "COMPLETELY FREE",
      cta: "BOOK FREE SESSION",
      color: "from-accent to-primary",
      stat: "$50K+",
      statLabel: "AVERAGE SAVINGS REVEALED",
      badge: "ZERO RISK",
      calendly: true
    },
    {
      icon: Bot,
      title: "Ready-Fire AI Assistants",
      subtitle: "PLUG & PLAY POWER",
      description: "Pre-built AI weapons that work instantly. No setup hell, no tech nightmares. Just RESULTS from day one.",
      features: [
        "INSTANT 24/7 customer support that never sleeps",
        "SMART email responses that sound human",
        "BULLETPROOF data entry automation",
        "GENIUS calendar AI that manages itself"
      ],
      pricing: "Starting at $297/month",
      cta: "GET INSTANT POWER",
      color: "from-accent to-primary",
      stat: "40%",
      statLabel: "TIME SAVED DAILY"
    },
    {
      icon: Cog,
      title: "Custom AI Domination",
      subtitle: "BUILT FOR YOUR EMPIRE",
      description: "100% custom AI systems that FIT your business like a glove. No compromises, no 'close enough' - just PERFECT automation that makes your competitors cry.",
      features: [
        "CUSTOM workflows that match your exact chaos",
        "SEAMLESS integration with your existing mess",
        "PROPRIETARY AI models nobody else has",
        "INFINITE scalability as you CONQUER markets"
      ],
      pricing: "CUSTOM PRICING",
      cta: "DEMAND PERFECTION",
      color: "from-secondary to-accent",
      stat: "90%",
      statLabel: "COST DESTRUCTION"
    },
    {
      icon: LineChart,
      title: "AI Profit Discovery",
      subtitle: "FIND YOUR HIDDEN GOLDMINE",
      description: "We X-RAY your business and find every single opportunity to make you rich with AI. No stone unturned, no profit left behind.",
      features: [
        "DEEP process excavation and profit mining",
        "EXPLOSIVE ROI projections that'll shock you",
        "BATTLE-TESTED implementation roadmap",
        "PRIORITY hit list for maximum impact"
      ],
      pricing: "$2,500 INVESTMENT",
      cta: "FIND MY GOLDMINE",
      color: "from-accent to-primary",
      stat: "200%",
      statLabel: "AVERAGE ROI EXPLOSION"
    },
    {
      icon: Users,
      title: "AI Empire Membership",
      subtitle: "YOUR PERSONAL AI ARMY",
      description: "VIP access to our AI masterminds. We become your secret weapon for TOTAL business domination. This is your AI advantage that competitors will NEVER have.",
      features: [
        "QUARTERLY empire expansion reviews",
        "CUTTING-EDGE technology updates before anyone else",
        "VIP priority support that jumps the line",
        "STRATEGIC war planning for market domination"
      ],
      pricing: "$12,000/YEAR INVESTMENT",
      cta: "JOIN THE ELITE",
      color: "from-primary to-secondary",
      stat: "98%",
      statLabel: "EMPIRE SUCCESS RATE"
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
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-black mb-8 shadow-xl">
            <Star className="h-5 w-5" />
            ⚡ CHOOSE YOUR WEAPON ⚡
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-none">
            SERVICES THAT
            <span className="block text-gradient text-6xl md:text-7xl lg:text-8xl">DOMINATE</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
            Stop choosing between good and fast. <span className="text-primary font-bold">Get BOTH.</span> 
            Every solution designed to make your competitors irrelevant.
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
            WHY WE <span className="text-gradient">DEMOLISH</span> THE COMPETITION
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
              <Link href="/learn">
                Learn More <Target className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
