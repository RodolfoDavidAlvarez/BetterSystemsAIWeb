import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Book, Code, Lightbulb, Sparkles } from "lucide-react";

// Define the structure for learning resources
interface LearningResource {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status: "available" | "coming-soon";
}

export default function LearnPage() {
  // List of learning resources
  const learningResources: LearningResource[] = [
    {
      title: "Build a Website with AI",
      description: "Learn how to leverage AI tools to design, develop, and deploy modern websites without extensive coding knowledge.",
      icon: <Code className="h-8 w-8" />,
      href: "/learn/build-website-with-ai",
      status: "available",
    },
    {
      title: "AI for Business Automation",
      description: "Discover how to automate repetitive tasks and workflows using AI solutions.",
      icon: <Sparkles className="h-8 w-8" />,
      href: "/learn/ai-business-automation",
      status: "coming-soon",
    },
    {
      title: "Building Your AI Assistant",
      description: "Step-by-step guide to creating customized AI assistants for your specific business needs.",
      icon: <Lightbulb className="h-8 w-8" />,
      href: "/learn/build-ai-assistant",
      status: "coming-soon",
    },
    {
      title: "AI Implementation Strategies",
      description: "Strategic approaches to successfully implementing AI solutions in your organization.",
      icon: <Book className="h-8 w-8" />,
      href: "/learn/ai-implementation-strategies",
      status: "coming-soon",
    },
  ];

  return (
    <div className="container mx-auto py-16 px-4 md:py-24">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="space-y-8 text-center">
          <div className="inline-block p-2 bg-primary/10 rounded-full text-primary">
            <Book className="h-6 w-6" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Learn AI with Better Systems
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Practical guides and resources to help you understand and implement AI solutions for your business.
          </p>
        </div>

        {/* Resources Grid */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Learning Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningResources.map((resource) => (
              <Card key={resource.title} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {resource.icon}
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 flex justify-between items-center">
                  {resource.status === "available" ? (
                    <Button asChild className="mt-2">
                      <Link href={resource.href}>
                        Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="mt-2">
                      Coming Soon
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Learn AI Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Why Learn About AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Understanding AI capabilities and applications is essential for modern business leaders. Our resources are designed to help you:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <div className="rounded-full bg-primary/10 p-1 text-primary h-6 w-6 flex items-center justify-center shrink-0">1</div>
                  <span>Make informed decisions about AI implementation</span>
                </li>
                <li className="flex gap-3">
                  <div className="rounded-full bg-primary/10 p-1 text-primary h-6 w-6 flex items-center justify-center shrink-0">2</div>
                  <span>Identify opportunities for business improvement through AI</span>
                </li>
                <li className="flex gap-3">
                  <div className="rounded-full bg-primary/10 p-1 text-primary h-6 w-6 flex items-center justify-center shrink-0">3</div>
                  <span>Understand the practical steps to deploy AI solutions</span>
                </li>
                <li className="flex gap-3">
                  <div className="rounded-full bg-primary/10 p-1 text-primary h-6 w-6 flex items-center justify-center shrink-0">4</div>
                  <span>Stay ahead of industry trends and technological advancements</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Sparkles className="h-16 w-16 text-primary mx-auto" />
                <p className="text-xl font-medium">Empower your business with AI knowledge</p>
                <p className="text-sm text-muted-foreground">
                  Practical insights without the technical jargon
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/5 rounded-xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">Need Personalized Guidance?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our team can provide custom training and implementation support for your specific business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/services">View Our Services</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}