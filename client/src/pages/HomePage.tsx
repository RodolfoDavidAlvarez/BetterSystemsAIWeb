import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Hero from "@/components/sections/Hero";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      {/* Overview Sections */}
      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Services Overview */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Our Services</h2>
          <p className="text-muted-foreground">
            Transform your business with our cutting-edge AI solutions. From virtual assistants to 
            custom AI applications, we provide comprehensive solutions to drive your business forward.
          </p>
          <Button asChild variant="outline">
            <Link href="/services">View All Services</Link>
          </Button>
        </section>

        {/* About Overview */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">About Us</h2>
          <p className="text-muted-foreground">
            At Better Systems AI, we're dedicated to helping businesses embrace the future 
            of work through innovative AI solutions and expert guidance.
          </p>
          <Button asChild variant="outline">
            <Link href="/about">Learn More About Us</Link>
          </Button>
        </section>

        {/* Partners Overview */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Our Partners</h2>
          <p className="text-muted-foreground">
            We collaborate with industry leaders to deliver the best AI solutions 
            for your business needs.
          </p>
          <Button asChild variant="outline">
            <Link href="/partners">View Our Partners</Link>
          </Button>
        </section>

        {/* Contact CTA */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Get Started</h2>
          <p className="text-muted-foreground">
            Ready to transform your business with AI? Contact us today for a consultation 
            or book a meeting with our experts.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/booking">Book Consultation</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
