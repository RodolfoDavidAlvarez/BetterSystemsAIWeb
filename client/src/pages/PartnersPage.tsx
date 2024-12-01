import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const partners = [
  {
    name: "Soil Seed and Water",
    logo: "/SSW Logo.png",
    description: "Environmental solutions for sustainable agriculture"
  },
  {
    name: "Agave Environmental Contracting, Inc.",
    logo: "/AEC-Horizontal-Official-Logo-2020.png",
    description: "Leading environmental contracting services"
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
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
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
              <p className="text-muted-foreground text-center">{partner.description}</p>
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
