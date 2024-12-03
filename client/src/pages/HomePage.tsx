import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Hero from "@/components/sections/Hero";
import WhatWeDo from "@/components/sections/WhatWeDo";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function HomePage() {
  const services = [
    {
      title: "AI-Powered Assistants",
      description: "Transform customer service with intelligent virtual assistants",
      href: "/services/ai-assistants"
    },
    {
      title: "Efficiency Audit",
      description: "Discover optimization opportunities in your business processes",
      href: "/services/efficiency-audit"
    },
    {
      title: "Fleet Management",
      description: "Streamline your fleet operations with AI-enhanced tools",
      href: "/services/fleet-management"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      {/* Key AI Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6">Key AI Benefits for Your Business</h2>
            <p className="text-lg text-muted-foreground">
              Discover how AI implementation can transform your business metrics and drive sustainable growth.
            </p>
          </div>

          <Carousel
            className="w-full max-w-[90rem] mx-auto px-4 lg:px-20"
            opts={{
              align: "center",
              loop: true,
              active: true,
              dragFree: true,
              containScroll: "trimSnaps",
              skipSnaps: true,
              breakpoints: {
                "(max-width: 768px)": { align: "start", dragFree: false },
                "(min-width: 769px)": { align: "center" }
              }
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
          >
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105">
                  <CardContent className="flex flex-col justify-between p-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-6">Customer Experience Enhancement</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-4xl font-bold text-primary">40% Faster</div>
                          <p className="text-lg mt-2">Response Times</p>
                        </div>
                        <div>
                          <p className="text-lg mt-2">AI chatbots and automation streamline customer support, reducing wait times.</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <p className="text-lg font-semibold text-primary">Why It Matters:</p>
                      <p className="text-lg">Improved customer experiences drive loyalty, repeat business, and long-term growth.</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105">
                  <CardContent className="flex flex-col justify-between p-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-6">Market Leadership Opportunity</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-4xl font-bold text-primary">$19.9 Trillion</div>
                          <p className="text-lg mt-2">Economic Contribution: AI is projected to add trillions to the global economy by 2030.</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <p className="text-lg font-semibold text-primary">Why It Matters:</p>
                      <p className="text-lg">Adopting AI now positions your business as a leader in a rapidly growing market.</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full transition-all duration-300 hover:scale-105">
                  <CardContent className="flex flex-col justify-between p-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-6">Operational Reliability</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-4xl font-bold text-primary">30% Reduction</div>
                          <p className="text-lg mt-2">in Downtime: AI systems optimize processes, preventing costly disruptions.</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <p className="text-lg font-semibold text-primary">Why It Matters:</p>
                      <p className="text-lg">Reliable operations mean smoother workflows, fewer delays, and better customer satisfaction.</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="-left-4 lg:-left-8 xl:-left-12" />
            <CarouselNext className="-right-4 lg:-right-8 xl:-right-12" />
          </Carousel>

          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8">
              Act Now: AI adoption is rapidly transforming industries, making it essential to stay ahead of the curve and remain competitive.
            </p>
            <Button asChild variant="default" size="lg" className="font-semibold">
              <Link href="/business-impact">Learn more about AI transforming businesses today →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <WhatWeDo />
      
      {/* Mission Statement */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Empowering businesses through innovative AI solutions, we transform 
              traditional operations into efficient, automated systems that drive 
              growth and success in today's digital landscape.
            </p>
          </div>
        </div>
      </section>

      {/* Overview Sections */}
      <div className="container mx-auto px-4 py-20 space-y-32">
        {/* Services Overview */}
        <section className="space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Our Services</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Transform your business with our cutting-edge AI solutions. From virtual assistants to 
              custom AI applications, we provide comprehensive solutions that drive innovation and growth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
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
        <section className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold">About Better Systems AI</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Better Systems AI, we're dedicated to helping businesses embrace the future 
              of work through innovative AI solutions and expert guidance. Our team brings together
              decades of experience in AI, business transformation, and technology implementation
              to deliver results that matter.
            </p>
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
        <section className="text-center space-y-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Our Partners</h2>
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
        <section className="bg-primary/5 rounded-2xl p-16 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Take the first step towards AI-powered efficiency. Contact us today for a consultation 
            or book a meeting with our experts to discuss your unique business needs and how we can help.
          </p>
          <div className="flex gap-6 justify-center">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link href="/booking">Book Consultation</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}