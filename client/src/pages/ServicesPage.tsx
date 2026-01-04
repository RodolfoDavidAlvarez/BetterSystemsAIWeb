import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import {
  ArrowRight,
  Check,
  Clock,
  Coffee,
  MessageCircle,
  Sparkles,
  Target,
  Lightbulb,
  Calendar
} from "lucide-react";

export default function ServicesPage() {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      icon: Coffee,
      title: "Let's Talk",
      subtitle: "A conversation, not a sales pitch",
      description: "Here's the thing - I don't know if I can help you until we actually talk. Book a quick call, tell me what's eating up your time, and I'll give you my honest take. If AI isn't the right fit, I'll tell you that too.",
      features: [
        "We'll map out where you're losing time",
        "I'll share what's actually working for other businesses",
        "You'll leave with actionable ideas (whether we work together or not)",
        "Zero pressure, just real talk"
      ],
      pricing: "On the house",
      cta: "Book a Call",
      color: "from-primary to-secondary",
      stat: "30",
      statLabel: "minutes that could change everything",
      badge: "START HERE",
      link: "/book"
    },
    {
      icon: Clock,
      title: "Get Your Time Back",
      subtitle: "Automate the stuff you hate doing",
      description: "You know those tasks that make you think 'there has to be a better way'? There is. I'll build AI that handles the repetitive work so you can focus on the stuff that actually moves the needle.",
      features: [
        "Those 3-hour reports? Done in minutes",
        "Customer questions at 2am? Handled automatically",
        "Data entry that makes you want to scream? Gone",
        "The boring admin work? Runs itself"
      ],
      pricing: "Depends on complexity",
      cta: "Let's Discuss",
      color: "from-accent to-primary",
      stat: "20+",
      statLabel: "hours back every week",
      link: "/contact"
    },
    {
      icon: Target,
      title: "Built for Your Business",
      subtitle: "Not a one-size-fits-all solution",
      description: "Your business isn't like everyone else's, so why would an off-the-shelf tool work? I build custom AI systems that fit how YOU actually work - not the other way around.",
      features: [
        "Connects to the tools you already use",
        "Learns your specific processes",
        "Grows with your business",
        "You own it completely"
      ],
      pricing: "Custom quote",
      cta: "Tell Me What You Need",
      color: "from-secondary to-accent",
      stat: "100%",
      statLabel: "built around you",
      link: "/contact"
    },
    {
      icon: Lightbulb,
      title: "Figure Out Where to Start",
      subtitle: "Because AI is confusing - I get it",
      description: "Everyone's talking about AI but nobody's explaining it in a way that makes sense. I'll dig into your business, find where AI can actually help (and where it can't), and give you a clear roadmap.",
      features: [
        "Full breakdown of your current processes",
        "Honest assessment of what's worth automating",
        "Clear priorities - what to do first, second, third",
        "Real numbers on what you'd save"
      ],
      pricing: "$2,500",
      cta: "Get Clarity",
      color: "from-accent to-primary",
      stat: "Clear",
      statLabel: "roadmap to follow",
      link: "/contact"
    }
  ];

  const realTalk = [
    {
      question: "Is AI going to replace my employees?",
      answer: "Honestly? No. It handles the boring repetitive stuff so your team can do more valuable work. Your best people probably hate data entry anyway."
    },
    {
      question: "I'm not technical - will I understand this?",
      answer: "That's literally my job. I translate tech-speak into normal human words. If you can use a smartphone, you can use what I build."
    },
    {
      question: "What if it doesn't work for my industry?",
      answer: "I've worked with landscapers, composters, fleet managers, and everything in between. The principles are the same - saving time and reducing headaches."
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 overflow-hidden">
      <SEO
        title="How I Can Help - Rodo Alvarez | AI for Business Owners"
        description="Tired of hearing about AI without understanding how it applies to YOUR business? Let's have an actual conversation about what's possible."
      />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        {/* Header - Personal & Direct */}
        <div className="text-center mb-16">
          <p className="text-primary font-medium mb-4">For business owners who want results, not buzzwords</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Let me show you what
            <span className="block text-gradient">AI can actually do</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everyone's talking about AI. Most of it is noise.
            I help business owners cut through the hype and find what actually works.
          </p>
        </div>

        {/* Personal intro card */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white rounded-2xl p-8 shadow-lg border mb-16 max-w-3xl mx-auto">
          <img
            src="/Professional Headshot Rodolfo compressed.jpg"
            alt="Rodo Alvarez"
            className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
          />
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              "I've spent years figuring out what works and what's just hype.
              Now I help business owners like you skip the trial-and-error
              and go straight to results."
            </p>
            <p className="text-primary font-semibold mt-3">— Rodo Alvarez</p>
          </div>
        </div>

        {/* Service Cards - Simpler, More Personal */}
        <div className="space-y-8 mb-20">
          {services.map((service, index) => (
            <Card
              key={index}
              className={`overflow-hidden transition-all duration-300 hover:shadow-xl ${index === 0 ? 'border-2 border-primary/30' : ''}`}
            >
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3 gap-0">
                  {/* Left side - Service info */}
                  <div className="md:col-span-2 p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${service.color}`}>
                        <service.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{service.title}</h3>
                        <p className="text-muted-foreground">{service.subtitle}</p>
                      </div>
                      {service.badge && (
                        <span className="ml-auto px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          {service.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Investment</p>
                        <p className="text-xl font-bold text-primary">{service.pricing}</p>
                      </div>
                      <Button asChild className="ml-auto">
                        <Link href={service.link}>
                          {service.cta} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Right side - Stat */}
                  <div className={`hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-br ${service.color} text-white`}>
                    <span className="text-5xl font-black">{service.stat}</span>
                    <span className="text-sm text-center opacity-90 mt-2">{service.statLabel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Real Talk / FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">Real talk</h2>
          <p className="text-center text-muted-foreground mb-10">Questions I get asked all the time</p>

          <div className="space-y-6 max-w-3xl mx-auto">
            {realTalk.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
                <p className="font-semibold text-lg mb-3 flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                  {item.question}
                </p>
                <p className="text-muted-foreground pl-8">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simple Process */}
        <div className="bg-muted/30 rounded-2xl p-8 md:p-12 mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Here's how it usually goes</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { num: "1", title: "We talk", desc: "You tell me what's frustrating you" },
              { num: "2", title: "I dig in", desc: "I figure out where AI can actually help" },
              { num: "3", title: "We build", desc: "Custom solution, not cookie-cutter" },
              { num: "4", title: "You win", desc: "More time, less headaches" }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA - Personal */}
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Curious if AI makes sense for you?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Let's have a real conversation. No pitch deck, no pressure - just an honest chat about what's possible for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/book">
                <Calendar className="mr-2 h-5 w-5" />
                Book a Call
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/contact">
                Send me a message
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
