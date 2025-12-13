import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { BookOpen, Video, FileText, ArrowRight } from "lucide-react";

export default function LearnPage() {
  const resources = [
    {
      icon: Video,
      category: "Video Tutorials",
      title: "Getting Started with AI Automation",
      description: "Learn the basics of AI automation and how it can transform your business operations.",
      duration: "15 min",
      type: "video"
    },
    {
      icon: FileText,
      category: "Guides",
      title: "AI Implementation Checklist",
      description: "Step-by-step guide to successfully implement AI in your organization.",
      duration: "10 min read",
      type: "guide"
    },
    {
      icon: Video,
      category: "Case Studies",
      title: "How Small Businesses Save with AI",
      description: "Real examples of businesses that reduced costs by 90% with our solutions.",
      duration: "20 min",
      type: "video"
    },
    {
      icon: BookOpen,
      category: "Best Practices",
      title: "AI Security & Privacy Guide",
      description: "Essential practices for secure and ethical AI implementation.",
      duration: "15 min read",
      type: "article"
    }
  ];

  const faqs = [
    {
      question: "How long does AI implementation take?",
      answer: "Most basic AI assistants can be deployed within 2-4 weeks. Custom solutions typically take 6-12 weeks depending on complexity."
    },
    {
      question: "Do I need technical expertise to use AI?",
      answer: "No! Our solutions are designed to be user-friendly. We handle all the technical setup and provide training for your team."
    },
    {
      question: "What's the ROI on AI automation?",
      answer: "Most clients see 200%+ ROI within the first year through cost savings and increased efficiency."
    },
    {
      question: "Is my data secure with AI?",
      answer: "Absolutely. We use enterprise-grade security and never share your data. All AI models are trained specifically for your business."
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20">
      <SEO 
        title="Learn About AI - Better Systems AI"
        description="Free resources to help you understand AI automation for business. Tutorials, guides, and best practices."
      />
      
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Learn AI for Business
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Free resources to help you understand and implement AI automation
          </p>
        </div>

        {/* Featured Resource */}
        <Card className="mb-16 border-0 shadow-lg bg-primary/5">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-primary font-semibold mb-2 block">Featured Guide</span>
                <h2 className="text-3xl font-bold mb-4">
                  AI Automation Starter Kit
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Everything you need to know before implementing AI in your business. 
                  Includes ROI calculator, readiness assessment, and implementation roadmap.
                </p>
                <Button asChild size="lg">
                  <Link href="/contact">
                    Download Free Kit <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="bg-background rounded-lg p-8 text-center">
                <BookOpen className="h-24 w-24 mx-auto text-primary mb-4" />
                <p className="text-2xl font-bold">30+ Pages</p>
                <p className="text-muted-foreground">of actionable insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Learning Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {resources.map((resource, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <resource.icon className="h-10 w-10 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-primary font-semibold mb-1">{resource.category}</p>
                      <h3 className="text-xl font-bold mb-2">{resource.title}</h3>
                      <p className="text-muted-foreground mb-3">{resource.description}</p>
                      <p className="text-sm text-muted-foreground">{resource.duration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary/5 rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your AI Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get personalized guidance on implementing AI in your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">Get Expert Help</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">View Our Services</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
