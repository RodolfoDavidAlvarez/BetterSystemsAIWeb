import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  FileText,
  PenTool,
  CreditCard,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  FileCheck,
  BarChart3,
} from "lucide-react";

// ─── Carousel slides ───

const slides = [
  {
    src: "/images/contractor-crm/dashboard.png",
    title: "Your Command Center",
    subtitle: "Pipeline, clients, and total revenue — all at a glance",
    label: "Dashboard",
  },
  {
    src: "/images/contractor-crm/proposal-builder-design.png",
    title: "Design the Project",
    subtitle:
      "Select house sections, set measurements, and add custom line items",
    label: "Design",
  },
  {
    src: "/images/contractor-crm/proposal-builder-payment.png",
    title: "Configure Payment",
    subtitle: "Set price per linear foot, deposit percentage, and payment method",
    label: "Payment",
  },
  {
    src: "/images/contractor-crm/e-signature.png",
    title: "Get It Signed",
    subtitle: "Customer signs right on their phone or your tablet",
    label: "E-Sign",
  },
  {
    src: "/images/contractor-crm/proposal-builder-review.png",
    title: "Review & Generate",
    subtitle:
      "Full pricing breakdown and one-click contract generation",
    label: "Review",
  },
  {
    src: "/images/contractor-crm/contract-detail.png",
    title: "Professional Contracts",
    subtitle: "Auto-generated PDF with download and email-to-client built in",
    label: "Contract",
  },
  {
    src: "/images/contractor-crm/proposals.png",
    title: "Track Every Job",
    subtitle: "Search, filter, and manage all proposals in one place",
    label: "Proposals",
  },
];

// ─── How it works ───

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Create a proposal on-site",
    detail:
      "Pick a template, fill in the details, generate a professional PDF — all from your phone.",
  },
  {
    number: "02",
    icon: PenTool,
    title: "Customer signs on their phone",
    detail:
      "Hand them the tablet or text them a link. They sign with their finger. Done.",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Payment collected instantly",
    detail:
      "Cash, check, or credit card. Stripe handles the processing. You get paid before you leave.",
  },
];

// ─── Integrations ───

const integrations = [
  {
    name: "Stripe",
    status: "Certified",
    description: "Secure payment processing",
    logo: (
      <svg viewBox="0 0 60 25" className="h-7 w-auto" aria-label="Stripe">
        <path
          fill="#635BFF"
          d="M5 10.2c0-.7.6-1 1.5-1 1.4 0 3.1.4 4.5 1.2V6.3C9.5 5.8 8 5.5 6.5 5.5 2.6 5.5 0 7.5 0 10.5c0 4.6 6.4 3.9 6.4 5.9 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.4v4.2c1.7.7 3.3 1 5 1 4 0 6.7-2 6.7-5 0-5-6.5-4.1-6.5-6.1zM16.1 2.5l-4.6 1-.1 13.6c0 2.5 1.9 4.3 4.4 4.3 1.4 0 2.4-.3 3-.6v-3.5c-.5.2-3.2 1-3.2-1.4V10h3.2V6.4h-3.2l.5-3.9zM24.1 10.7l-.3-1.3h-4v11.8h4.6v-8c1.1-1.4 2.9-1.1 3.5-1V6.4c-.6-.2-2.9-.6-3.8 1.3v3zM29.6 6.4h4.6v14.8h-4.6V6.4zm0-4.4l4.6-1v3.6l-4.6 1V2zM40.2 5.5c-1.6 0-2.7.8-3.3 1.3l-.2-1h-4.1v19.5l4.6-1v-4.7c.6.4 1.4 1 2.8 1 2.9 0 5.5-2.3 5.5-7.4-.1-4.6-2.7-7.7-5.3-7.7zm-.9 11.8c-.9 0-1.5-.3-1.9-.8v-6.3c.4-.5 1-.9 1.9-.9 1.5 0 2.5 1.7 2.5 4 0 2.3-1 4-2.5 4zM54.5 5.5c-3.1 0-5.1 2.7-5.1 7.2v.5c0 4.8 2.3 7.2 5.6 7.2 1.6 0 2.9-.4 4-1v-3.5c-1 .5-2.2.9-3.5.9-1.4 0-2.2-.5-2.4-2.1h6.2c0-.2.1-1 .1-1.7.1-4.2-1.8-7.5-4.9-7.5zm-1.4 5.7c0-1.6.8-2.3 1.5-2.3.7 0 1.4.7 1.4 2.3h-2.9z"
        />
      </svg>
    ),
  },
  {
    name: "QuickBooks",
    status: "Compatible",
    description: "Accounting & invoicing sync",
    logo: (
      <svg
        viewBox="0 0 40 40"
        className="h-7 w-auto"
        aria-label="QuickBooks"
      >
        <circle cx="20" cy="20" r="20" fill="#2CA01C" />
        <path
          fill="#fff"
          d="M10 20c0-3.3 2.7-6 6-6h1v3h-1c-1.7 0-3 1.3-3 3s1.3 3 3 3h2v-8h3v11h-5c-3.3 0-6-2.7-6-6zm14-5h5c3.3 0 6 2.7 6 6s-2.7 6-6 6h-1v-3h1c1.7 0 3-1.3 3-3s-1.3-3-3-3h-2v8h-3V15z"
        />
      </svg>
    ),
  },
];

// ─── Feature pills ───

const features = [
  { icon: FileCheck, label: "Proposals & Contracts" },
  { icon: PenTool, label: "E-Signatures" },
  { icon: CreditCard, label: "Payment Collection" },
  { icon: Users, label: "Client Management" },
  { icon: BarChart3, label: "Pipeline Tracking" },
];

// ─── Component ───

export default function ContractorCRMPage() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, []);

  // Auto-advance every 5s
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div className="min-h-screen bg-background">
      {/* Keyframe animations for title transitions */}
      <style>{`
        @keyframes ctorFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ctorProgress {
          from { width: 0; }
          to   { width: 100%; }
        }
        .ctor-title-enter { animation: ctorFadeUp .38s cubic-bezier(.22,1,.36,1) both; }
        .ctor-sub-enter   { animation: ctorFadeUp .38s cubic-bezier(.22,1,.36,1) .07s both; }
      `}</style>

      <SEO
        title="Contractor CRM — Proposals, Signatures, Payments"
        description="A proposal and payment system built for lighting, misting, and outdoor living contractors. Create proposals, collect e-signatures, and take payment from your phone."
        keywords="contractor CRM, lighting contractor software, proposal software, e-signature contractors, contractor payment system"
        url="https://bettersystems.ai/contractors"
      />

      {/* ─── Hero ─── */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-[2.75rem] font-bold leading-[1.2] tracking-tight mb-5">
            I built a proposal system for a lighting contractor.{" "}
            <span className="text-muted-foreground font-medium">
              It might work for you too.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
            Create proposals, collect e-signatures, and take payment — from your
            phone, on the job site. No paperwork, no second visits.
          </p>

          <Link href="/book">
            <Button size="lg" className="h-11 px-6 text-[15px]">
              Book a 15-min demo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Product Showcase ─── */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* ── Animated title ── */}
          <div className="text-center mb-6 md:mb-8 min-h-[68px] md:min-h-[76px] flex flex-col justify-end">
            <div key={current}>
              <h2 className="ctor-title-enter text-[1.65rem] md:text-[2rem] font-bold tracking-tight text-foreground">
                {slides[current].title}
              </h2>
              <p className="ctor-sub-enter text-muted-foreground text-[15px] md:text-base mt-1.5 max-w-lg mx-auto">
                {slides[current].subtitle}
              </p>
            </div>
          </div>

          {/* ── Browser frame ── */}
          <div
            className="relative group"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="rounded-xl border border-border/70 overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] bg-white">
              {/* Chrome bar */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/30 border-b border-border/40">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]/50" />
                <div className="ml-4 flex-1 max-w-sm">
                  <div className="bg-white/80 rounded-md px-3 py-1 text-[11px] text-muted-foreground/50 border border-border/30 truncate font-mono">
                    app.yourcompany.com
                  </div>
                </div>
              </div>

              {/* Image area — fixed aspect, crossfade, no squish */}
              <div className="relative aspect-[16/10] bg-[#f8f9fb]">
                {slides.map((slide, i) => (
                  <img
                    key={i}
                    src={slide.src}
                    alt={`${slide.label} — ${slide.subtitle}`}
                    className={`absolute inset-0 w-full h-full object-contain object-top transition-opacity duration-500 ease-in-out ${
                      i === current
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                    loading={i < 2 ? "eager" : "lazy"}
                    draggable={false}
                  />
                ))}
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={prev}
              className="absolute left-3 top-[55%] -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-border/50 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-[55%] -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-border/50 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* ── Tab navigation ── */}
          <div className="mt-5 md:mt-6 flex justify-center">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-muted/40 border border-border/30 overflow-x-auto max-w-full">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`relative px-3 md:px-4 py-1.5 text-[13px] md:text-sm rounded-md whitespace-nowrap transition-all duration-200 ${
                    i === current
                      ? "bg-white text-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {slide.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Auto-advance progress ── */}
          <div className="mt-3 mx-auto max-w-[280px] h-[2px] rounded-full bg-border/30 overflow-hidden">
            <div
              key={`prog-${current}-${paused}`}
              className="h-full bg-primary/30 rounded-full"
              style={{
                animation: paused ? "none" : "ctorProgress 3s linear both",
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── Feature pills ─── */}
      <section className="pb-16 md:pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex flex-wrap justify-center gap-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-muted/30 text-sm text-foreground/80"
              >
                <f.icon className="h-3.5 w-3.5 text-primary" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16 md:py-20 border-t border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-10">How it works</h2>

          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-5">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <step.icon className="h-[18px] w-[18px] text-foreground/70" />
                </div>
                <div className="pt-0.5">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-xs font-mono text-muted-foreground/60 tracking-wide">
                      {step.number}
                    </span>
                    <h3 className="text-[17px] font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Integrations ─── */}
      <section className="py-16 md:py-20 border-t border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-3">
            Built on trusted platforms
          </h2>
          <p className="text-muted-foreground text-[15px] mb-8">
            Your data and payments are handled by industry-standard systems.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {integrations.map((int) => (
              <div
                key={int.name}
                className="flex items-center gap-4 p-5 rounded-xl border border-border/60 bg-white"
              >
                <div className="shrink-0">{int.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px]">
                      {int.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" />
                      {int.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {int.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section className="py-16 md:py-20 border-t border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-start gap-5 md:gap-6">
            <img
              src="/Professional Headshot Rodolfo compressed.jpg"
              alt="Rodo Alvarez"
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shrink-0 border-2 border-border/60"
            />
            <div>
              <h3 className="text-lg font-semibold">Rodo Alvarez</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                <MapPin className="h-3.5 w-3.5" />
                Phoenix, AZ
              </p>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                I build software for contractors. This started as a custom
                project for a lighting company here in Phoenix — they needed a
                way to create proposals, get signatures, and collect payment
                without going back to the office. It worked well enough that I'm
                now making it available to other contractors in similar trades.
              </p>
              <p className="text-muted-foreground text-[15px] leading-relaxed mt-3">
                If you want to see how it works,{" "}
                <Link href="/book">
                  <span className="text-primary hover:underline cursor-pointer">
                    book a quick call
                  </span>
                </Link>{" "}
                and I'll walk you through it. No pitch — just showing you the
                product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Want to see if it works for your business?
          </h2>
          <p className="text-muted-foreground mb-8 text-[15px]">
            15 minutes. I'll show you the actual system. If it's not a fit, no
            hard feelings.
          </p>
          <Link href="/book">
            <Button size="lg" className="h-11 px-6 text-[15px]">
              Book a demo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
