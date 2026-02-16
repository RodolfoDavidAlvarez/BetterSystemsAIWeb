import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import {
  ArrowRight,
  Zap,
  Brain,
  Shield,
  Rocket,
  Target,
  Star,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  MessageSquare,
  Mail,
  Smartphone,
  Database,
  CreditCard,
  Cloud,
  Cpu,
  BarChart3,
  FileText,
  Truck,
  Scale,
  ShoppingCart,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ArrowDownRight,
  Workflow,
  Bot,
  Phone,
  Users,
  Building2,
  Wrench,
  ClipboardList,
  Receipt,
  Calculator,
  Send,
  Mic
} from "lucide-react";

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// Technology data with categories
const technologies = [
  { name: "Twilio SMS", icon: Smartphone, category: "Communication", color: "#F22F46" },
  { name: "Resend Email", icon: Mail, category: "Communication", color: "#00D4FF" },
  { name: "ElevenLabs AI", icon: Mic, category: "AI/Voice", color: "#6D28D9" },
  { name: "OpenAI", icon: Brain, category: "AI/Voice", color: "#00A67E" },
  { name: "Supabase", icon: Database, category: "Database", color: "#3ECF8E" },
  { name: "PostgreSQL", icon: Database, category: "Database", color: "#336791" },
  { name: "Stripe", icon: CreditCard, category: "Payments", color: "#635BFF" },
  { name: "QuickBooks", icon: Receipt, category: "Payments", color: "#2CA01C" },
  { name: "Next.js", icon: Zap, category: "Frontend", color: "#0F172A" },
  { name: "React", icon: Cpu, category: "Frontend", color: "#61DAFB" },
  { name: "TypeScript", icon: FileText, category: "Backend", color: "#3178C6" },
  { name: "Node.js", icon: Cloud, category: "Backend", color: "#539E43" },
  { name: "Mapbox", icon: Target, category: "Mapping", color: "#4264FB" },
  { name: "Airtable", icon: BarChart3, category: "Data", color: "#18BFFF" },
  { name: "Puppeteer", icon: FileText, category: "Automation", color: "#40B5A4" },
  { name: "Drizzle ORM", icon: Database, category: "Database", color: "#C5F74F" },
];

export default function HomePage() {
  const [isScrolling, setIsScrolling] = useState(true);
  const [activeCase, setActiveCase] = useState(0);
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animated counters for ROI section
  const hoursCounter = useAnimatedCounter(156, 2500);
  const costCounter = useAnimatedCounter(89, 2000);
  const accuracyCounter = useAnimatedCounter(99, 2200);

  const toggleScrolling = () => setIsScrolling(!isScrolling);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth'
      });
    }
  };

  // Case studies data
  const caseStudies = [
    {
      id: "weight-ticket",
      title: "Weight Ticket System",
      subtitle: "Waste Management Automation",
      icon: Scale,
      color: "#00D4FF",
      description: "SMS-based mobile entry system for field operators. Multi-tenant architecture supporting multiple companies with real-time synchronization.",
      problem: "Manual paper tickets causing 4+ hours daily data entry, frequent errors, and delayed invoicing",
      solution: "Operators text weight data directly from the field. AI validates, categorizes, and auto-generates invoices.",
      metrics: [
        { label: "Time Saved", value: "156", unit: "hrs/month", icon: Clock },
        { label: "Error Reduction", value: "98", unit: "%", icon: Target },
        { label: "Invoice Speed", value: "24", unit: "hrs faster", icon: Receipt },
        { label: "Cost Savings", value: "$4,200", unit: "/month", icon: DollarSign },
      ],
      flow: [
        { step: "1", label: "Operator texts weight", icon: Smartphone },
        { step: "2", label: "AI validates data", icon: Brain },
        { step: "3", label: "Auto-categorizes job", icon: ClipboardList },
        { step: "4", label: "Updates database", icon: Database },
        { step: "5", label: "Generates invoice", icon: Receipt },
        { step: "6", label: "Notifies admin", icon: Mail },
      ],
      tech: ["Twilio SMS", "Supabase", "OpenAI", "Resend Email", "React", "TypeScript"]
    },
    {
      id: "fleet-management",
      title: "Agave Fleet Management",
      subtitle: "AI-Powered Maintenance Tracking",
      icon: Truck,
      color: "#FFB800",
      description: "Complete fleet management with predictive maintenance, work order tracking, and AI-powered problem categorization.",
      problem: "Reactive maintenance causing expensive breakdowns, scattered records, and communication gaps",
      solution: "AI analyzes repair patterns to predict failures. Mechanics receive mobile-optimized dashboards with SMS alerts.",
      metrics: [
        { label: "Downtime Reduced", value: "67", unit: "%", icon: TrendingUp },
        { label: "Repair Costs", value: "41", unit: "% lower", icon: DollarSign },
        { label: "Response Time", value: "3", unit: "min avg", icon: Clock },
        { label: "Fleet Uptime", value: "94", unit: "%", icon: Truck },
      ],
      flow: [
        { step: "1", label: "Issue reported", icon: Phone },
        { step: "2", label: "AI categorizes", icon: Brain },
        { step: "3", label: "Priority assigned", icon: Target },
        { step: "4", label: "Mechanic notified", icon: Smartphone },
        { step: "5", label: "Work order created", icon: ClipboardList },
        { step: "6", label: "Analytics updated", icon: BarChart3 },
      ],
      tech: ["Next.js", "Supabase", "OpenAI", "Twilio SMS", "Recharts", "TypeScript"]
    },
    {
      id: "pay-pickup",
      title: "Pay & Pick Up",
      subtitle: "Zero-Wait Commerce",
      icon: ShoppingCart,
      color: "#00FF88",
      description: "Customers pay online, schedule pickup, and grab their order without waiting. No lines, no friction, no wasted time.",
      problem: "Long checkout lines, abandoned carts, staff overwhelmed during peak hours",
      solution: "Seamless online payment with scheduled pickup slots. QR code verification for instant order retrieval.",
      metrics: [
        { label: "Wait Time", value: "0", unit: "minutes", icon: Clock },
        { label: "Conversion", value: "34", unit: "% increase", icon: TrendingUp },
        { label: "Staff Time", value: "60", unit: "% freed", icon: Users },
        { label: "Peak Capacity", value: "3x", unit: "orders", icon: ShoppingCart },
      ],
      flow: [
        { step: "1", label: "Browse & select", icon: ShoppingCart },
        { step: "2", label: "Pay securely", icon: CreditCard },
        { step: "3", label: "Choose time slot", icon: Clock },
        { step: "4", label: "Get QR code", icon: Smartphone },
        { step: "5", label: "Arrive & scan", icon: Target },
        { step: "6", label: "Grab & go", icon: CheckCircle2 },
      ],
      tech: ["Stripe", "React", "Supabase", "Resend Email", "QR Generation", "TypeScript"]
    },
    {
      id: "proposal-crm",
      title: "Proposal CRM System",
      subtitle: "Quote-to-Contract Automation",
      icon: FileText,
      color: "#DC2626",
      description: "Generate professional proposals with aerial photo annotations, automatic calculations, and one-click PDF generation.",
      problem: "Hours spent creating proposals manually, inconsistent pricing, lost deals due to slow turnaround",
      solution: "Interactive proposal builder with real-time calculations, aerial view markup, and instant PDF delivery.",
      metrics: [
        { label: "Proposal Time", value: "15", unit: "min avg", icon: Clock },
        { label: "Close Rate", value: "28", unit: "% higher", icon: TrendingUp },
        { label: "Accuracy", value: "100", unit: "%", icon: Target },
        { label: "Revenue", value: "$52K", unit: "saved/yr", icon: DollarSign },
      ],
      flow: [
        { step: "1", label: "Client info entry", icon: Users },
        { step: "2", label: "Service selection", icon: ClipboardList },
        { step: "3", label: "Auto-calculate", icon: Calculator },
        { step: "4", label: "Aerial markup", icon: Target },
        { step: "5", label: "Generate PDF", icon: FileText },
        { step: "6", label: "Email & track", icon: Send },
      ],
      tech: ["React", "Puppeteer", "Supabase", "Stripe", "QuickBooks", "Sharp"]
    },
  ];

  const currentCase = caseStudies[activeCase];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <SEO
        title="Better Systems AI - Enterprise Automation That Actually Works"
        description="Transform your operations with AI-powered systems. SMS integration, intelligent automation, and custom solutions that save 150+ hours monthly."
      />

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet" />

      <style>{`
        .font-display { font-family: 'Manrope', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; opacity: 0.8; }
          50% { box-shadow: 0 0 40px currentColor, 0 0 80px currentColor; opacity: 1; }
        }

        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }

        @keyframes flow-line {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes counter-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes tech-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-gradient { animation: gradient-shift 8s ease infinite; background-size: 200% 200%; }
        .animate-tech-float { animation: tech-float 4s ease-in-out infinite; }

        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148,163,184,0.2);
          box-shadow: 0 8px 30px rgba(15,23,42,0.06);
        }

        .glow-cyan { text-shadow: 0 8px 24px #2563eb24; }
        .glow-amber { text-shadow: 0 8px 24px #b4530920; }
        .glow-green { text-shadow: 0 8px 24px #0f766e20; }

        .grid-bg {
          background-image:
            linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .noise-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        .flow-connector {
          stroke-dasharray: 8;
          animation: flow-line 1s linear infinite;
        }
      `}</style>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4 grid-bg noise-overlay overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#2563eb]/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#b45309]/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0f766e]/5 rounded-full blur-[120px]" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#2563eb]/20 to-[#0f766e]/20 border border-[#2563eb]/30 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#0f766e] animate-pulse" />
              <span className="font-body text-sm font-medium text-[#2563eb]">Enterprise-Grade AI Automation</span>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95]">
              <span className="text-slate-900">SYSTEMS THAT</span>
              <br />
              <span className="bg-gradient-to-r from-[#2563eb] via-[#0f766e] to-[#b45309] bg-clip-text text-transparent animate-gradient">
                ACTUALLY WORK
              </span>
            </h1>

            <p className="font-body text-xl sm:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Custom AI automation that integrates <span className="text-[#2563eb] font-semibold">SMS</span>,
              <span className="text-[#0f766e] font-semibold"> email</span>,
              <span className="text-[#b45309] font-semibold"> voice AI</span>, and
              <span className="text-[#dc2626] font-semibold"> payments</span> into one seamless system.
              <span className="block mt-2 text-slate-900 font-semibold">Save 150+ hours monthly.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="bg-gradient-to-r from-[#2563eb] to-[#0f766e] text-white font-display font-bold text-lg px-8 py-6 h-14 hover:shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:scale-105">
                <Link href="/book">
                  BOOK CONSULTATION <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-slate-300 text-slate-900 font-display font-bold text-lg px-8 py-6 h-14 hover:bg-white/90 hover:border-slate-400 transition-all duration-300 bg-transparent">
                <Link href="#case-studies">
                  VIEW CASE STUDIES
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: "150+", label: "Hours Saved Monthly", color: "#2563eb" },
                { value: "99%", label: "System Uptime", color: "#0f766e" },
                { value: "24/7", label: "AI Working For You", color: "#b45309" },
                { value: "5x", label: "Faster Operations", color: "#dc2626" },
              ].map((stat, i) => (
                <div key={i} className="glass-card rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300">
                  <div className="font-display text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="font-body text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Link href="/rodolfo" className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4 max-w-md w-full sm:w-auto hover:shadow-xl transition-shadow">
                <img
                  src="/Professional Portrait Rodolfo.jpg"
                  alt="Rodolfo Alvarez, CEO and Founder"
                  className="h-14 w-14 rounded-full object-cover object-top ring-2 ring-[#2563eb]/20"
                />
                <div className="text-left">
                  <p className="font-display text-sm font-semibold text-slate-900 leading-tight">Rodolfo Alvarez</p>
                  <p className="font-body text-xs text-slate-600">CEO & Founder, Better Systems AI</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
          <span className="font-body text-xs uppercase tracking-widest">Scroll to explore</span>
          <ArrowDownRight className="h-5 w-5 animate-bounce" />
        </div>
      </section>

      {/* ==================== TECHNOLOGY CONSTELLATION ==================== */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-slate-900">TECHNOLOGY</span>
              <span className="text-[#2563eb] glow-cyan"> STACK</span>
            </h2>
            <p className="font-body text-xl text-slate-600 max-w-2xl mx-auto">
              Enterprise integrations that power real-world automation
            </p>
          </div>

          {/* Technology Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
            {technologies.map((tech, index) => (
              <div
                key={tech.name}
                className={`glass-card rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:scale-110 ${
                  hoveredTech === tech.name ? 'ring-2' : ''
                }`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  borderColor: hoveredTech === tech.name ? tech.color : 'transparent',
                  boxShadow: hoveredTech === tech.name ? `0 0 30px ${tech.color}40` : 'none'
                }}
                onMouseEnter={() => setHoveredTech(tech.name)}
                onMouseLeave={() => setHoveredTech(null)}
              >
                <div
                  className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-all duration-300"
                  style={{ backgroundColor: `${tech.color}20` }}
                >
                  <tech.icon className="h-6 w-6" style={{ color: tech.color }} />
                </div>
                <div className="font-body text-xs font-medium text-slate-900 truncate">{tech.name}</div>
                <div className="font-body text-[10px] text-slate-500 mt-1">{tech.category}</div>
              </div>
            ))}
          </div>

          {/* Category Legend */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-body">
            {["Communication", "AI/Voice", "Database", "Payments", "Frontend", "Backend"].map((cat) => (
              <div key={cat} className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#0f766e]" />
                {cat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CASE STUDIES WITH FLOWCHARTS ==================== */}
      <section id="case-studies" className="relative py-24 px-4 grid-bg">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-slate-900">REAL</span>
              <span className="text-[#b45309] glow-amber"> SYSTEMS</span>
            </h2>
            <p className="font-body text-xl text-slate-600 max-w-2xl mx-auto">
              Production solutions delivering measurable ROI
            </p>
          </div>

          {/* Case Study Navigation */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {caseStudies.map((study, index) => (
              <button
                key={study.id}
                onClick={() => setActiveCase(index)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-body font-medium transition-all duration-300 ${
                  activeCase === index
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white/90'
                }`}
                style={{
                  backgroundColor: activeCase === index ? study.color : undefined,
                  boxShadow: activeCase === index ? `0 0 30px ${study.color}60` : 'none'
                }}
              >
                <study.icon className="h-4 w-4" />
                {study.title}
              </button>
            ))}
          </div>

          {/* Active Case Study */}
          <div className="glass-card rounded-3xl p-8 md:p-12 overflow-hidden relative">
            {/* Decorative glow */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[80px] opacity-30"
              style={{ backgroundColor: currentCase.color }}
            />

            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
              {/* Left: Info & Metrics */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentCase.color}20` }}
                  >
                    <currentCase.icon className="h-8 w-8" style={{ color: currentCase.color }} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-slate-900">{currentCase.title}</h3>
                    <p className="font-body text-slate-600">{currentCase.subtitle}</p>
                  </div>
                </div>

                <p className="font-body text-slate-700 mb-6 leading-relaxed">
                  {currentCase.description}
                </p>

                {/* Problem/Solution */}
                <div className="space-y-4 mb-8">
                  <div className="glass-card rounded-xl p-4 border-l-4 border-red-500/50">
                    <div className="font-body text-xs uppercase tracking-wider text-red-400 mb-1">Problem</div>
                    <div className="font-body text-slate-700 text-sm">{currentCase.problem}</div>
                  </div>
                  <div className="glass-card rounded-xl p-4 border-l-4" style={{ borderColor: currentCase.color }}>
                    <div className="font-body text-xs uppercase tracking-wider mb-1" style={{ color: currentCase.color }}>Solution</div>
                    <div className="font-body text-slate-700 text-sm">{currentCase.solution}</div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {currentCase.metrics.map((metric, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300">
                      <metric.icon className="h-5 w-5 mx-auto mb-2" style={{ color: currentCase.color }} />
                      <div className="font-display text-2xl font-bold text-slate-900">{metric.value}<span className="text-sm text-slate-600">{metric.unit}</span></div>
                      <div className="font-body text-xs text-slate-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Flow Diagram */}
              <div className="relative">
                <div className="font-display text-sm uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  System Flow
                </div>

                <div className="space-y-4">
                  {currentCase.flow.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      {/* Step number */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-slate-900 shrink-0 group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: currentCase.color }}
                      >
                        {step.step}
                      </div>

                      {/* Arrow connector */}
                      {i < currentCase.flow.length - 1 && (
                        <div className="absolute left-6 h-4 w-0.5 bg-gradient-to-b from-transparent via-slate-300 to-transparent" style={{ top: `${(i * 68) + 60}px` }} />
                      )}

                      {/* Step content */}
                      <div className="glass-card rounded-xl p-4 flex-1 flex items-center gap-3 group-hover:bg-white/90 transition-all duration-300">
                        <step.icon className="h-5 w-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
                        <span className="font-body text-slate-700 group-hover:text-slate-900 transition-colors">{step.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Used */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="font-body text-xs uppercase tracking-wider text-slate-500 mb-3">Technologies Used</div>
                  <div className="flex flex-wrap gap-2">
                    {currentCase.tech.map((tech, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-white/80 font-body text-xs text-slate-700 border border-slate-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ROI CALCULATOR SECTION ==================== */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/5 via-slate-100 to-[#0f766e]/5" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-slate-900">PROJECTED</span>
              <span className="text-[#0f766e] glow-green"> SAVINGS</span>
            </h2>
            <p className="font-body text-xl text-slate-600">
              Based on average client results from the Weight Ticket System
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 md:p-12">
            {/* Scenario Description */}
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f766e]/10 border border-[#0f766e]/20 mb-4">
                <Scale className="h-4 w-4 text-[#0f766e]" />
                <span className="font-body text-sm text-[#0f766e]">Realistic Scenario</span>
              </div>
              <p className="font-body text-slate-700 leading-relaxed">
                A waste management company processing <span className="text-slate-900 font-semibold">200 weight tickets per week</span> with
                <span className="text-slate-900 font-semibold"> 3 operators</span> in the field. Manual entry takes
                <span className="text-slate-900 font-semibold"> 3 minutes per ticket</span>, with
                <span className="text-[#dc2626] font-semibold"> 8% error rate</span> causing invoice delays.
              </p>
            </div>

            {/* Big Numbers */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div ref={hoursCounter.ref} className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-transparent border border-[#2563eb]/20">
                <Clock className="h-10 w-10 mx-auto mb-4 text-[#2563eb]" />
                <div className="font-display text-6xl font-bold text-[#2563eb] mb-2">
                  {hoursCounter.count}<span className="text-2xl">hrs</span>
                </div>
                <div className="font-body text-slate-600">Saved Monthly</div>
                <div className="font-body text-sm text-slate-500 mt-2">
                  From 40hrs/week → 4hrs/week data entry
                </div>
              </div>

              <div ref={costCounter.ref} className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#0f766e]/10 to-transparent border border-[#0f766e]/20">
                <DollarSign className="h-10 w-10 mx-auto mb-4 text-[#0f766e]" />
                <div className="font-display text-6xl font-bold text-[#0f766e] mb-2">
                  ${hoursCounter.count * 27}<span className="text-2xl">/mo</span>
                </div>
                <div className="font-body text-slate-600">Cost Reduction</div>
                <div className="font-body text-sm text-slate-500 mt-2">
                  At $27/hr admin labor cost
                </div>
              </div>

              <div ref={accuracyCounter.ref} className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#b45309]/10 to-transparent border border-[#b45309]/20">
                <Target className="h-10 w-10 mx-auto mb-4 text-[#b45309]" />
                <div className="font-display text-6xl font-bold text-[#b45309] mb-2">
                  {accuracyCounter.count}<span className="text-2xl">%</span>
                </div>
                <div className="font-body text-slate-600">Data Accuracy</div>
                <div className="font-body text-sm text-slate-500 mt-2">
                  AI validation eliminates human error
                </div>
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-display font-bold text-red-400">BEFORE</span>
                </div>
                <ul className="space-y-3 font-body text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✕</span>
                    Paper tickets lost in trucks
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✕</span>
                    4+ hours daily manual data entry
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✕</span>
                    Invoices delayed 3-5 days
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✕</span>
                    Disputes from calculation errors
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f766e]/5 border border-[#0f766e]/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-[#0f766e]" />
                  <span className="font-display font-bold text-[#0f766e]">AFTER</span>
                </div>
                <ul className="space-y-3 font-body text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#0f766e] mt-0.5 shrink-0" />
                    SMS entry from anywhere in the field
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#0f766e] mt-0.5 shrink-0" />
                    Real-time database sync
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#0f766e] mt-0.5 shrink-0" />
                    Same-day invoice generation
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#0f766e] mt-0.5 shrink-0" />
                    AI-validated accuracy
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PARTNERS CAROUSEL ==================== */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 mb-4">
              <Star className="h-4 w-4 text-[#b45309]" />
              <span className="font-body text-sm text-slate-600">Trusted Partners</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Powering Real Businesses
            </h2>
          </div>

          <div className="relative">
            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={() => scrollCarousel('left')}
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-slate-300 hover:border-slate-400 bg-transparent"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={toggleScrolling}
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-slate-300 hover:border-slate-400 bg-transparent"
              >
                {isScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                onClick={() => scrollCarousel('right')}
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-slate-300 hover:border-slate-400 bg-transparent"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-hidden mx-auto" ref={scrollRef}>
              <div className={`flex gap-12 py-4 ${isScrolling ? 'animate-scroll-x' : ''}`}>
                {[1, 2].map((group) => (
                  <div key={group} className="flex items-center gap-12 shrink-0">
                    <img src="/partner-desert-moon.png" alt="Desert Moon Lighting" className="h-12 md:h-14 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0" />
                    <img src="/partner-desert-mist.png" alt="Desert Mist Arizona" className="h-12 md:h-14 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0" />
                    <img src="/partner-agave.png" alt="Agave Fleet" className="h-12 md:h-14 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0" />
                    <img src="/partner-ssw.png" alt="Soil Seed & Water" className="h-12 md:h-14 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0" />
                    <img src="/partner-aec.png" alt="AEC" className="h-12 md:h-14 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0" />
                    <img src="/partner-azcc.png" alt="Arizona Composting Council" className="h-12 md:h-14 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SERVICES OVERVIEW ==================== */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-slate-900">WHAT WE</span>
              <span className="bg-gradient-to-r from-[#2563eb] to-[#0f766e] bg-clip-text text-transparent"> BUILD</span>
            </h2>
            <p className="font-body text-xl text-slate-600 max-w-2xl mx-auto">
              End-to-end automation solutions tailored to your operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "SMS Automation",
                description: "Two-way texting for field operations, appointment reminders, and customer notifications.",
                color: "#2563eb",
                features: ["Twilio Integration", "Auto-Responses", "Bulk Messaging"]
              },
              {
                icon: Bot,
                title: "AI Voice Agents",
                description: "24/7 AI receptionists that handle calls, book appointments, and answer questions.",
                color: "#8B5CF6",
                features: ["ElevenLabs Voice", "Natural Conversations", "Call Routing"]
              },
              {
                icon: Mail,
                title: "Email Systems",
                description: "Transactional emails, automated sequences, and intelligent routing.",
                color: "#dc2626",
                features: ["Resend API", "Custom Templates", "Analytics"]
              },
              {
                icon: CreditCard,
                title: "Payment Processing",
                description: "Stripe integration with invoicing, subscriptions, and QuickBooks sync.",
                color: "#635BFF",
                features: ["Stripe Connect", "Auto-Invoicing", "Payment Links"]
              },
              {
                icon: Database,
                title: "Custom Databases",
                description: "Multi-tenant architectures with real-time sync and role-based access.",
                color: "#3ECF8E",
                features: ["Supabase", "Real-time Updates", "API Access"]
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboards",
                description: "Beautiful visualizations that turn your data into actionable insights.",
                color: "#b45309",
                features: ["Recharts", "Custom Reports", "KPI Tracking"]
              },
            ].map((service, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 group"
                style={{
                  borderColor: 'transparent',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${service.color}15` }}
                >
                  <service.icon className="h-7 w-7" style={{ color: service.color }} />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="font-body text-slate-600 text-sm mb-4">{service.description}</p>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, j) => (
                    <span key={j} className="px-2 py-1 rounded-full bg-white/80 font-body text-xs text-slate-600">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/15 via-slate-100 to-[#0f766e]/15 animate-gradient" />
        <div className="absolute inset-0 grid-bg opacity-50" />

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 border border-slate-300 mb-8">
            <Rocket className="h-4 w-4 text-[#0f766e]" />
            <span className="font-body text-sm text-slate-900">Ready to automate?</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="text-slate-900">LET'S BUILD YOUR</span>
            <br />
            <span className="bg-gradient-to-r from-[#2563eb] via-[#0f766e] to-[#b45309] bg-clip-text text-transparent">
              PERFECT SYSTEM
            </span>
          </h2>

          <p className="font-body text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Book a free consultation. We'll analyze your operations and show you exactly how automation can transform your business.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-slate-900 text-white font-display font-bold text-lg px-10 py-6 h-16 hover:shadow-[0_12px_28px_rgba(15,23,42,0.3)] transition-all duration-300 hover:scale-105">
              <Link href="/book">
                BOOK CONSULTATION <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-slate-300 text-slate-900 font-display font-bold text-lg px-10 py-6 h-16 hover:bg-white/90 transition-all duration-300 bg-transparent">
              <Link href="/contact">
                CONTACT US
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-500 font-body text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Enterprise Security
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              24/7 Support
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Proven Results
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
