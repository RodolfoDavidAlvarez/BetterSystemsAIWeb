import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { ArrowRight, Zap, Users, Brain, Shield, Rocket, Target, Star, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export default function HomePage() {
  const [isScrolling, setIsScrolling] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const toggleScrolling = () => {
    setIsScrolling(!isScrolling);
  };
  
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  const benefits = [
    { 
      icon: Zap, 
      title: "STOP WASTING TIME", 
      description: "Your AI handles the boring stuff while you build your empire. Finally."
    },
    { 
      icon: Rocket, 
      title: "20+ HOURS BACK", 
      description: "Every. Single. Week. That's what our clients get back to focus on what matters."
    },
    { 
      icon: Target, 
      title: "RESULTS THAT SHOCK", 
      description: "90% cost cuts aren't promises. They're what actually happens when AI works right."
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI That Actually Gets It",
      description: "No more explaining the same thing 50 times. Our AI learns your business like your best employee - but never calls in sick.",
      badge: "GAME CHANGER"
    },
    {
      icon: Users,
      title: "Built for YOUR Chaos",
      description: "Cookie-cutter solutions? Not here. We build AI that fits your weird, wonderful, complicated business exactly how it is.",
      badge: "CUSTOM BUILT"
    },
    {
      icon: Shield,
      title: "Fort Knox Security",
      description: "Your data stays YOUR data. Bank-level security, zero compromises, sleep-like-a-baby peace of mind.",
      badge: "BULLETPROOF"
    }
  ];

  const process = [
    { 
      step: "1", 
      title: "WE LISTEN", 
      description: "Tell us what's driving you crazy. What takes forever? What makes you want to scream? We get it."
    },
    { 
      step: "2", 
      title: "WE BUILD", 
      description: "Custom AI that actually solves YOUR problems. Not some generic 'solution' that solves nothing."
    },
    { 
      step: "3", 
      title: "YOU WIN", 
      description: "Watch tasks disappear. See hours return to your life. Feel the relief of things just... working."
    },
    { 
      step: "4", 
      title: "WE OPTIMIZE", 
      description: "Because good isn't good enough. We keep making it better until it's absolutely perfect."
    }
  ];

  const stats = [
    { number: "500+", label: "HOURS SAVED", description: "Every single week across our clients", impact: "WEEKLY" },
    { number: "90%", label: "COST CUTS", description: "Real numbers from real businesses", impact: "GUARANTEED" },
    { number: "24/7", label: "AI WORKING", description: "While you sleep, vacation, live your life", impact: "NON-STOP" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Better Systems AI - Stop Wasting Time on Tasks Your AI Should Handle"
        description="Finally, AI that actually works. Get 20+ hours back every week. 90% cost cuts. Real results from real AI that handles your business chaos."
      />
      
      {/* HERO SECTION - MAXIMUM IMPACT */}
      <section className="relative pt-16 pb-12 px-4 sm:pt-20 sm:pb-16 md:pt-24 md:pb-20 hero-pattern overflow-hidden">
        {/* High-energy background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="fade-in text-center lg:text-left order-2 lg:order-1">
              {/* POWER BADGE */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm mb-6 shadow-lg">
                <Star className="h-4 w-4" />
                AI THAT ACTUALLY WORKS
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-none">
                STOP DOING
                <span className="block text-gradient text-5xl sm:text-6xl md:text-7xl lg:text-8xl">BUSYWORK</span>
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mt-2">Automate All Your Problems!</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 font-medium">
                Finally, AI that handles the chaos so you can focus on what actually grows your business. 
                <span className="text-primary font-bold">20+ hours back every week.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg px-8 py-4 h-14 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
                  <Link href="/book">
                    BOOK CONSULTATION <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-primary text-primary font-bold text-lg px-8 py-4 h-14 hover:bg-primary hover:text-white transition-all">
                  <Link href="/contact">
                    CONTACT US
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="fade-in animation-delay-200 order-1 lg:order-2">
              <div className="relative max-w-lg mx-auto lg:max-w-none">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
                <img 
                  src="/images/Cover Photo (Better systems AI).jpg" 
                  alt="AI That Actually Works - Real Results in Action" 
                  className="relative w-full h-auto rounded-2xl shadow-2xl border-4 border-white transform hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS CAROUSEL - SOCIAL PROOF */}
      <section className="py-16 bg-gradient-to-br from-muted/30 to-primary/5 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12 fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-black mb-6 shadow-xl">
              <Star className="h-5 w-5" />
              TRUSTED BY THE BEST
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              JOIN OUR <span className="text-gradient">PARTNER NETWORK</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              Industry leaders trust us to revolutionize their operations
            </p>
          </div>
          
          <div className="relative">
            {/* Navigation Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={() => scrollCarousel('left')}
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-2 border-primary/20 hover:border-primary/40"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={toggleScrolling}
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-2 border-primary/20 hover:border-primary/40"
              >
                {isScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                onClick={() => scrollCarousel('right')}
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-2 border-primary/20 hover:border-primary/40"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="overflow-hidden mx-auto" ref={scrollRef}>
              <div className={`flex gap-12 py-4 ${isScrolling ? 'animate-scroll-x' : ''}`}>
                <div className="flex items-center gap-12 shrink-0">
                  <img src="/partner-desert-moon.png" alt="Desert Moon Lighting" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-desert-mist.png" alt="Desert Mist Arizona" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-agave.png" alt="Agave Fleet" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-ssw.png" alt="Soil Seed & Water" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-aec.png" alt="AEC" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-azcc.png" alt="Arizona Composting Council" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex items-center gap-12 shrink-0">
                  <img src="/partner-desert-moon.png" alt="Desert Moon Lighting" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-desert-mist.png" alt="Desert Mist Arizona" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-agave.png" alt="Agave Fleet" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-ssw.png" alt="Soil Seed & Water" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-aec.png" alt="AEC" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                  <img src="/partner-azcc.png" alt="Arizona Composting Council" className="h-14 md:h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS - HIGH ENERGY */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 decorative-dots"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 decorative-dots"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6">
              REAL RESULTS, <span className="text-gradient">REAL FAST</span>
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto">
              Stop dreaming about efficiency. <span className="text-primary font-bold">Start living it.</span>
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group text-center hover-lift fade-in bg-white border-2 border-primary/10 hover:border-primary/30 transition-all duration-300" style={{animationDelay: `${index * 0.1}s`}}>
                <CardContent className="p-8">
                  <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary to-secondary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mb-4 text-primary">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium text-lg">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - POWER MESSAGING */}
      <section className="section-padding">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              NOT YOUR AVERAGE <span className="text-gradient">AI SOLUTION</span>
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
              We don't do cookie-cutter. We build AI that fits your business like a custom suit.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover-lift fade-in h-full bg-white border-2 border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden" style={{animationDelay: `${index * 0.1 + 0.2}s`}}>
                <div className="bg-gradient-to-r from-primary to-secondary p-1">
                  <div className="bg-white p-0.5">
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2">
                      <span className="text-xs font-black text-primary">{feature.badge}</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-grow font-medium">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS - CONFIDENCE */}
      <section className="section-padding bg-section-pattern relative">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              HOW WE <span className="text-gradient">BLOW YOUR MIND</span>
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
              Four steps to freedom from busywork forever.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((item, index) => (
              <div key={index} className="text-center fade-in relative" style={{animationDelay: `${index * 0.1 + 0.3}s`}}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-black text-2xl mb-6 shadow-xl hover:scale-110 transition-transform duration-300">
                  {item.step}
                </div>
                <div className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 accent-border h-full border-2 border-primary/10 hover:border-primary/30">
                  <h3 className="text-lg sm:text-xl font-black mb-3 text-primary">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS - PROOF */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 decorative-dots"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 decorative-dots"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-12 fade-in">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              THE <span className="text-gradient">PROOF</span> IS IN THE NUMBERS
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center fade-in bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 border-2 border-primary/10 hover:border-primary/30" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-black mb-4">
                  {stat.impact}
                </div>
                <h3 className="text-5xl sm:text-6xl font-black text-gradient mb-3">{stat.number}</h3>
                <h4 className="text-lg sm:text-xl font-black mb-2 text-primary">{stat.label}</h4>
                <p className="text-muted-foreground font-medium">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - MAXIMUM ENERGY */}
      <section className="section-padding bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="fade-in">
            <div className="inline-block px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-black mb-8">
              ⚡ READY TO STOP THE MADNESS? ⚡
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-white leading-tight">
              GET YOUR LIFE BACK
            </h2>
            <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
              Stop wasting time on tasks your AI should handle. 
              <span className="font-black"> Start building the business you actually want.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto sm:max-w-none">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-black text-xl px-10 py-6 h-16 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all">
                <Link href="/book">
                  BOOK CONSULTATION <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-4 border-white text-white hover:bg-white/20 font-black text-xl px-10 py-6 h-16 backdrop-blur-sm">
                <Link href="/contact">
                  CONTACT US
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
