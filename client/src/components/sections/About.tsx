import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const team = [
  {
    name: "Sarah Johnson",
    role: "CEO & Founder",
    avatar: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    name: "Michael Chen",
    role: "CTO",
    avatar: "https://i.pravatar.cc/150?u=michael",
  },
  {
    name: "Emma Davis",
    role: "Head of AI Strategy",
    avatar: "https://i.pravatar.cc/150?u=emma",
  },
];

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
          <h3 className="text-2xl font-bold mb-4">Our Leadership Team</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the experts leading our mission to transform businesses through AI innovation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <Card key={member.name} className="text-center">
              <CardContent className="pt-6">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <h4 className="font-bold mb-2">{member.name}</h4>
                <p className="text-muted-foreground">{member.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
