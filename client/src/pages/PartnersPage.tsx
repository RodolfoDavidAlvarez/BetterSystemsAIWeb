import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const partners = [
  {
    name: "TechForward Solutions",
    logo: "https://placehold.co/200x100",
    description: "Leading provider of enterprise software solutions"
  },
  {
    name: "DataStream Analytics",
    logo: "https://placehold.co/200x100",
    description: "Experts in big data and analytics platforms"
  },
  {
    name: "CloudScale Systems",
    logo: "https://placehold.co/200x100",
    description: "Cloud infrastructure and scaling specialists"
  },
  {
    name: "AI Innovations Corp",
    logo: "https://placehold.co/200x100",
    description: "Pioneers in artificial intelligence research"
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

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {partners.map((partner, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-20 object-contain mb-4"
              />
              <h2 className="text-xl font-bold mb-2">{partner.name}</h2>
              <p className="text-muted-foreground">{partner.description}</p>
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
