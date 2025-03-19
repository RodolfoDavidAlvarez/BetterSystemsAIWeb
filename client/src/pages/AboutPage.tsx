import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const founder = {
  name: "Rodolfo",
  role: "Founder & CEO",
  avatar: "/Professional Headshot Rodolfo compressed.jpg",
};

const values = [
  {
    title: "Client-Centricity",
    description: "We assess unique business needs comprehensively, identifying inefficiencies and recommending tailored solutions."
  },
  {
    title: "Innovation",
    description: "Driving business growth by pioneering AI and automation solutions that enhance efficiency, productivity, and competitive advantage."
  },
  {
    title: "Continuous Research",
    description: "Staying ahead of industry trends by consistently exploring and integrating the latest advancements in AI technology."
  }
];

const beliefs = [
  {
    title: "Technology Accessibility",
    description: "We believe emerging technologies should be available to every business regardless of expertise, business size, or industry."
  },
  {
    title: "Personalized Solutions",
    description: "Every business has unique services, processes, and necessities to be the most optimal in their specific business field."
  }
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Mission & Vision */}
      <div className="max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-8 text-center">About Better Systems AI</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              To make the most updated automation and AI technologies available to small-medium size businesses 
              that enhances efficiency, drives profits and growth, and fosters long-term competitive sustainability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground">
              To be the trusted partner that empowers businesses with the most updated emerging technology, 
              ensuring they remain competitive in a rapidly evolving digital world.
            </p>
          </section>
        </div>
      </div>

      {/* Core Beliefs */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Core Beliefs</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {beliefs.map((belief, index) => (
            <Card key={index} className="border-border/40 hover:border-border/60 transition-colors duration-300">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{belief.title}</h3>
                <p className="text-muted-foreground">{belief.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Core Values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="border-border/40 hover:border-border/60 transition-colors duration-300">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Leadership */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Leadership</h2>
        <Card className="max-w-md mx-auto border-border/40 hover:border-border/60 transition-colors duration-300">
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
            <h3 className="font-bold text-xl mb-2 text-center">{founder.name}</h3>
            <p className="text-muted-foreground text-center mb-4">{founder.role}</p>
            <p className="text-muted-foreground text-center">
              A passionate technologist and business leader dedicated to helping companies 
              leverage AI to achieve their full potential.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Team Members */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-center">Our Team</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
            <CardContent className="pt-6">
              <div className="p-4">
                <Avatar className="h-48 w-48 mx-auto mb-6">
                  <AvatarImage 
                    src="/team/jesus-landin.jpg"
                    alt="Jesus Landin"
                    className="object-cover object-top"
                    loading="eager"
                  />
                  <AvatarFallback>JL</AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-bold text-xl mb-2 text-center">Jesus Landin</h3>
              <p className="text-muted-foreground text-center mb-4">Mechanical Engineer</p>
              <p className="text-muted-foreground text-center">
                A skilled mechanical engineer bringing technical expertise and innovative solutions 
                to our engineering challenges and system implementations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 hover:border-border/60 transition-colors duration-300">
            <CardContent className="pt-6">
              <div className="p-4">
                <Avatar className="h-48 w-48 mx-auto mb-6">
                  <AvatarImage 
                    src="/Alejandra Portrait Photo for Website.jpg"
                    alt="Alejandra Alvarez"
                    className="object-cover object-top"
                    loading="eager"
                  />
                  <AvatarFallback>AA</AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-bold text-xl mb-2 text-center">Alejandra Alvarez</h3>
              <p className="text-muted-foreground text-center mb-4">Google Ad and SEO Strategist / Front End Developer</p>
              <p className="text-muted-foreground text-center">
                A skilled front-end developer with 4+ years of experience, specializing in Google Ads and SEO strategies to optimize digital presence and drive business growth.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
