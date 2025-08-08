import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Hero from "@/components/sections/Hero";
import WhatWeDo from "@/components/sections/WhatWeDo";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaOptionsType } from "embla-carousel";
import { SEO } from "@/components/SEO";

interface Service {
  title: string;
  description: string;
  href: string;
}

export default function HomePage() {
  const services: Service[] = [
    {
      title: "AI Assistants",
      description: "Pre-built, subscription-based automation tools for everyday business tasks",
      href: "/services/ai-assistants"
    },
    {
      title: "Personalized Automation Solutions",
      description: "Fully customized AI solutions built to address specific business challenges",
      href: "/services/custom-solutions"
    },
    {
      title: "AI Efficiency Assessment",
      description: "Comprehensive evaluation to identify inefficiencies and recommend optimizations",
      href: "/services/ai-efficiency-assessment"
    },
    {
      title: "AI Consulting",
      description: "Annual membership providing ongoing AI guidance, company check-ups and alerts on relevant industry breakthroughs",
      href: "/services/ai-consulting"
    }
  ];

  const [api, setApi] = React.useState<CarouselApi | null>(null);

  const options = React.useMemo<EmblaOptionsType>(
    () => ({
      align: "center" as const,
      loop: true,
      dragFree: false,
      containScroll: "trimSnaps" as const,
      skipSnaps: true,
      duration: 25,
      breakpoints: {
        "(max-width: 768px)": { align: "start" as const },
        "(min-width: 769px)": { align: "center" as const, dragFree: true }
      }
    }),
    []
  );

  const autoplayPlugin = React.useMemo(
    () =>
      Autoplay({
        delay: 5000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    []
  );

  React.useEffect(() => {
    if (!api) return;

    const onDestroy = () => {
      autoplayPlugin.stop();
    };

    autoplayPlugin.reset();
    api.on("destroy", onDestroy);

    return () => {
      api.off("destroy", onDestroy);
      autoplayPlugin.stop();
    };
  }, [api, autoplayPlugin]);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Better Systems AI - AI Automation Solutions for Business"
        description="Transform your business with AI automation. Reduce costs by 90%, save thousands of hours, and achieve 200%+ ROI with our custom AI assistants and consulting services."
      />
      <Hero />

      {/* Welcome Video */}
      <section className="py-12 md:py-20 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Welcome to Better Systems AI</h2>
            <p className="text-lg text-muted-foreground">
              Learn about our mission to make advanced AI technology accessible to businesses of all sizes.
            </p>
          </div>
          <div className="aspect-video max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/S6ADa0Xu0zY"
              title="Welcome to Better Systems AI"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Key AI Benefits */}
      <section id="services" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Key AI Benefits for Your Business</h2>
            <p className="text-lg text-muted-foreground">
              Discover how AI implementation can transform your business metrics and drive sustainable growth.
            </p>
          </div>

          <Carousel
            className="w-full max-w-[90rem] mx-auto px-4 lg:px-20"
            opts={options}
            plugins={[autoplayPlugin]}
            setApi={setApi}
          >
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105 border-0 hover:bg-accent/5 shadow-sm hover:shadow">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Customer Experience</h3>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-3 md:mb-4">40% Faster Response</div>
                    <p className="text-base md:text-lg">
                      AI chatbots and automation streamline customer support, reducing wait times and improving satisfaction.
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105 border-0 hover:bg-accent/5 shadow-sm hover:shadow">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Operational Reliability</h3>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-3 md:mb-4">30% Less Downtime</div>
                    <p className="text-base md:text-lg">
                      AI systems optimize processes, preventing costly disruptions and ensuring smoother workflows.
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105 border-0 hover:bg-accent/5 shadow-sm hover:shadow">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Revenue Growth</h3>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-3 md:mb-4">20%+ Increase</div>
                    <p className="text-base md:text-lg">
                      Companies using AI report significant revenue increases through new opportunities and optimized operations.
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105 border-0 hover:bg-accent/5 shadow-sm hover:shadow">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">ROI Impact</h3>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-3 md:mb-4">$4.60 per $1 Spent</div>
                    <p className="text-base md:text-lg">
                      AI investments deliver substantial returns by automating processes and unlocking new revenue streams.
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105 border-0 hover:bg-accent/5 shadow-sm hover:shadow">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Cost Reduction</h3>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-3 md:mb-4">Up to 40% Savings</div>
                    <p className="text-base md:text-lg">
                      AI-powered automation slashes operational expenses while maintaining or improving service quality.
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105 border-0 hover:bg-accent/5 shadow-sm hover:shadow">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Productivity Boost</h3>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-3 md:mb-4">40% More Output</div>
                    <p className="text-base md:text-lg">
                      AI accelerates workflows and reduces wasted time, allowing teams to focus on high-value strategic work.
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 lg:-left-8 xl:-left-12" />
            <CarouselNext className="hidden md:flex -right-4 lg:-right-8 xl:-right-12" />
          </Carousel>

          <div className="text-center max-w-3xl mx-auto mt-16">
            <p className="text-lg text-muted-foreground">
              Act Now: AI adoption is rapidly transforming industries, making it essential to stay ahead of the curve and remain competitive.
            </p>
          </div>
        </div>
      </section>

      <WhatWeDo />

      {/* Mission & Vision Statement */}
      <section id="about" className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              To make the most updated automation and AI technologies available to small-medium size businesses 
              that enhances efficiency, drives profits and growth, and fosters long-term competitive sustainability.
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Our Vision</h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8 md:mb-12">
              To be the trusted partner that empowers businesses with the most updated emerging technology, 
              ensuring they remain competitive in a rapidly evolving digital world.
            </p>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">Core Beliefs</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">Technology Accessibility</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe emerging technologies should be available to every business regardless of expertise, 
                  business size, or industry.
                </p>
              </div>
              <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">Personalized Solutions</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Every business has unique services, processes, and necessities to be the most optimal 
                  in their specific business field.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Sections */}
      <div className="container mx-auto px-4 py-12 md:py-20 space-y-20 md:space-y-32">
        {/* Services Overview */}
        <section className="space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Our Services</h2>
            <p className="text-lg text-muted-foreground mb-8">
              We deliver practical, ROI-focused AI solutions that reduce labor costs, boost operational efficiency, 
              and ensure your business remains at the forefront of innovation in your industry.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 hover:bg-accent/5 shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6">{service.description}</p>
                  <Button asChild variant="link" className="p-0 group-hover:translate-x-1 transition-transform">
                    <Link href={service.href}>Explore Service →</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="default" size="lg" className="font-semibold">
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </section>

        {/* About Overview */}
        <section className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">About Better Systems AI</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Better Systems AI is a dedicated consulting firm, and technology integrator and partner, 
              ensuring long-term success of small to medium-size businesses through innovative AI and automation. 
              We believe technology should be accessible to every business regardless of expertise, business size or industry.
            </p>
            <div className="pt-4">
              <h3 className="text-2xl font-semibold mb-4">What Makes Us Different</h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                We are not a software subscription service where users only utilize 20-40% of the software's capacity. 
                We build a partner relationship, treating your business as if it were our own.
              </p>
            </div>
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link href="/about">Learn More About Us</Link>
            </Button>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
              alt="Team collaboration"
              className="rounded-lg shadow-xl"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-lg" />
          </div>
        </section>

        {/* Partners Overview */}
        <section id="partners" className="text-center space-y-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Our Partners</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We collaborate with industry leaders to deliver the best AI solutions
              for your business needs. Join our growing network of successful partnerships
              and be part of the AI transformation journey.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-8 font-semibold">
              <Link href="/partners">View Our Partners</Link>
            </Button>
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="bg-primary/5 rounded-2xl p-8 md:p-12 lg:p-16 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed">
            Take the first step towards AI-powered efficiency. Contact us today to discuss your unique business needs and how we can help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link href="/get-started">Request Solution</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}