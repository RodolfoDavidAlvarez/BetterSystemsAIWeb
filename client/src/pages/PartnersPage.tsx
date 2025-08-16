import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const partners = [
  {
    name: "Soil Seed and Water",
    logo: "/SSW Logo.png",
    description: "SSW focuses on sustainable agriculture solutions by providing high-quality composting products, enhancing soil health, and supporting eco-friendly farming practices."
  },
  {
    name: "Agave Environmental Contracting, Inc.",
    logo: "/AEC-Horizontal-Official-Logo-2020.png",
    description: "Agave Environmental Contracting, Inc. provides expert landscaping services with 34+ years of experience and 6,000+ completed projects.",
    caseStudy: {
      title: "Fleet Management System",
      description: "We helped Agave optimize their fleet of 300+ vehicles, saving them 2,500+ annual labor hours and reducing maintenance costs by 22% through our comprehensive AI-powered fleet management system.",
      link: "/services/fleet-management"
    }
  },
  {
    name: "HITA of Arizona",
    logo: "/partner-hita.png",
    description: "HITA of Arizona is a leading hospitality and tourism association dedicated to supporting Arizona's vibrant hospitality industry through advocacy, education, and networking."
  }
];

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Our Partners</h1>
        <p className="text-muted-foreground">
          We collaborate with industry leaders to deliver comprehensive AI solutions 
          that drive business transformation and growth.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16 max-w-5xl mx-auto">
        {partners.map((partner, index) => (
          <Card key={index} className="border border-border/10 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="h-32 flex items-center justify-center mb-6 bg-white rounded-lg">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-full max-w-full object-contain p-4"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/400x200?text=' + encodeURIComponent(partner.name);
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-center">{partner.name}</h2>
              <p className="text-muted-foreground text-center mb-4">{partner.description}</p>
              
              {partner.caseStudy && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">Success Story: {partner.caseStudy.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{partner.caseStudy.description}</p>
                  <Link 
                    href={partner.caseStudy.link}
                    className="text-primary hover:underline inline-flex items-center text-sm font-medium"
                  >
                    View Case Study <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Become a Partner</h2>
        <p className="text-muted-foreground mb-8">
          Interested in partnering with Better Systems AI? Let's explore how we can 
          work together to deliver innovative AI solutions.
        </p>
        <Button asChild size="lg">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
