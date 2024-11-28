import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Rocket, LineChart, Shield } from "lucide-react";

const services = [
  {
    title: "AI Strategy Consulting",
    description: "Develop a comprehensive AI roadmap tailored to your business goals",
    icon: Brain,
  },
  {
    title: "Process Automation",
    description: "Streamline operations with intelligent automation solutions",
    icon: Rocket,
  },
  {
    title: "Data Analytics",
    description: "Transform raw data into actionable business insights",
    icon: LineChart,
  },
  {
    title: "AI Security",
    description: "Implement robust security measures for AI systems",
    icon: Shield,
  },
];

export default function Services() {
  return (
    <section id="services" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We provide end-to-end AI transformation services to help your business thrive in the digital age.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader>
                <service.icon className="h-12 w-12 text-primary mb-4" />
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8 items-center">
          <img
            src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89"
            alt="Modern Office Technology"
            className="rounded-lg shadow-xl"
          />
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Modern Solutions for Modern Businesses
            </h3>
            <p className="text-muted-foreground mb-6">
              Our cutting-edge technology stack and industry expertise enable us to deliver 
              solutions that drive real business value and competitive advantage.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
