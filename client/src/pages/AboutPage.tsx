import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Linkedin, Mail, Target, Lightbulb, Users, Award, ArrowRight, Zap } from "lucide-react";

export default function AboutPage() {
  const team = [
    {
      name: "Rodolfo Alvarez",
      role: "CEO & Founder",
      bio: "AI strategist with 15+ years transforming businesses through smart automation",
      avatar: "/Professional Portrait Rodolfo.jpg",
      linkedin: "https://linkedin.com/in/rodolfoalvarez",
      email: "ralvarez@bettersystems.ai"
    },
    {
      name: "Adrian Romero",
      role: "CTO & Co-Founder", 
      bio: "Full-stack developer who makes AI work in the real world",
      linkedin: "https://linkedin.com/in/adrianromero",
      email: "adrian@bettersystems.ai"
    }
  ];

  const values = [
    {
      icon: Target,
      title: "Results That Matter",
      description: "We don't just talk tech - we deliver measurable impact on your bottom line"
    },
    {
      icon: Lightbulb,
      title: "Smart Innovation",
      description: "Cutting-edge AI applied to real business problems, not tech for tech's sake"
    },
    {
      icon: Users,
      title: "Human-Centered",
      description: "AI should make your life easier, not more complicated. Period."
    },
    {
      icon: Award,
      title: "Excellence Always",
      description: "We're not satisfied until your business is transformed"
    }
  ];

  const stats = [
    { number: "500+", label: "Hours Saved Weekly" },
    { number: "90%", label: "Average Cost Reduction" },
    { number: "24/7", label: "AI Working For You" },
    { number: "100%", label: "Client Satisfaction" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-muted/30 to-primary/5 py-20">
      <SEO 
        title="About Us - Better Systems AI"
        description="Meet the team behind Better Systems AI. We're on a mission to make AI accessible to every business."
      />
      
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-bold mb-6">
            <Zap className="h-4 w-4 text-primary" />
            WHO WE ARE
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            AI Experts Who <span className="text-primary">Get Business</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're not just tech nerds. We're business people who happen to be really good at making AI work for you.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
              <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <Card className="mb-16 border-0 shadow-xl bg-gradient-to-br from-white to-primary/5 overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Our Mission</h2>
              <p className="text-lg md:text-xl text-muted-foreground text-center leading-relaxed">
                To democratize AI for every business. No more watching big corporations use technology 
                you can't access. We bring enterprise-level AI automation to companies that actually 
                need it most - yours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Drives Us</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">The Minds Behind the Magic</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all group">
                <CardContent className="p-8 text-center">
                  {member.avatar ? (
                    <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden ring-2 ring-primary/20 shadow-md group-hover:scale-105 transition-transform">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-3xl font-bold text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                  <p className="text-primary font-semibold mb-4">{member.role}</p>
                  <p className="text-muted-foreground mb-6">{member.bio}</p>
                  <div className="flex justify-center gap-4">
                    <Button asChild size="sm" variant="outline" className="hover:bg-primary hover:text-white">
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="hover:bg-primary hover:text-white">
                      <a href={`mailto:${member.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the AI Revolution?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Let's talk about how we can transform your business with AI that actually works.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl">
            <Link href="/contact">
              Start Your Transformation <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
