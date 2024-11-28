import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const founder = {
  name: "Rodolfo",
  role: "Founder & CEO",
  avatar: "/Professional Portrait Rodolfo.jpg",
};

export default function About() {
  return (
    <section id="about" className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">About Better Systems AI</h2>
            <p className="text-muted-foreground mb-4">
              We are a team of AI experts, business strategists, and technology 
              enthusiasts dedicated to helping businesses embrace the future of work.
            </p>
            <p className="text-muted-foreground">
              Our mission is to make AI transformation accessible, practical, and 
              impactful for businesses of all sizes.
            </p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1497215842964-222b430dc094"
            alt="Team Meeting"
            className="rounded-lg shadow-xl"
          />
        </div>

        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-4">Meet Our Founder</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Leading our mission to transform businesses through innovative AI solutions.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="p-4">
                <Avatar className="h-48 w-48 mx-auto mb-6">
                  <AvatarImage 
                    src={founder.avatar} 
                    alt={founder.name}
                    className="object-cover object-top"
                    loading="eager"
                  />
                  <AvatarFallback>{founder.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <h4 className="font-bold mb-2">{founder.name}</h4>
              <p className="text-muted-foreground mb-4">{founder.role}</p>
              <p className="text-muted-foreground">
                A passionate technologist and business leader dedicated to helping companies 
                leverage AI to achieve their full potential.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
