import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const partners = [
  {
    name: "Soil Seed and Water",
    logo: "/ssw-logo.png",
    description: "Environmental solutions for sustainable agriculture"
  },
  {
    name: "Agave Environmental Contracting, Inc.",
    logo: "/aec-logo.png",
    description: "Leading environmental contracting services"
  }
];

export default function Partners() {
  return (
    <section id="partners" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Collaborating with industry leaders to deliver comprehensive AI solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {partners.map((partner) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="h-full shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="h-24 flex items-center justify-center mb-6 bg-white rounded-lg p-6">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-3">{partner.name}</h3>
                  <p className="text-gray-600 text-center">{partner.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
