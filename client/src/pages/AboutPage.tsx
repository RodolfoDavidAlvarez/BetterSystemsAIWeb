import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const founder = {
  name: "Rodolfo",
  role: "Founder & CEO",
  avatar: "/Professional Headshot Rodolfo compressed.jpg",
};

const values = [
  {
    title: "Innovation",
    description: "Embracing the latest technologies to provide state-of-the-art solutions."
  },
  {
    title: "Simplicity",
    description: "Making complex technologies easy to understand and use."
  },
  {
    title: "Customer-Centric",
    description: "Your success is our priority. We tailor solutions to meet your specific needs."
  },
  {
    title: "Integrity",
    description: "Upholding the highest standards of integrity in all our actions."
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
              At Better Systems AI, our mission is to empower businesses to transition seamlessly 
              into the modern era of AI and automation. By leveraging cutting-edge AI technologies, 
              we enable companies to maximize productivity, reduce costs, and significantly 
              increase revenue.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground">
              We aim to be the leading provider of AI and automation solutions for small to 
              medium-sized businesses. Recognized for our innovation, efficiency, and 
              customer-centric approach, we transform traditional business operations and set 
              new standards for productivity and growth in the digital age.
            </p>
          </section>
        </div>
      </div>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <Card key={index}>
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
        <Card className="max-w-md mx-auto">
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
          <Card>
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

          <Card>
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
