
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Facebook, CalendarDays, Mail, Phone } from "lucide-react";
import { BrandX } from "@/components/ui/icons/brand-x";

const socialLinks = [
  {
    title: "X (Twitter)",
    href: "https://x.com/bettersystemsai",
    icon: BrandX,
    color: "bg-black hover:bg-neutral-900",
  },
  {
    title: "Facebook",
    href: "https://facebook.com/bettersystemsai",
    icon: Facebook,
    color: "bg-[#1877F2] hover:bg-[#1664D9]",
  },
  {
    title: "Email Us",
    href: "mailto:contact@bettersystems.ai",
    icon: Mail,
    color: "bg-[#EA4335] hover:bg-[#D93025]",
  },
  {
    title: "Call Us",
    href: "tel:+1234567890",
    icon: Phone,
    color: "bg-[#34A853] hover:bg-[#2E8B47]",
  },
  {
    title: "Book a Consultation",
    href: "/booking",
    icon: CalendarDays,
    color: "bg-primary hover:bg-primary/90",
  },
];

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-16 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-8">
          {/* Profile Section */}
          <div className="text-center">
            <Avatar className="h-40 w-40 mx-auto mb-4">
              <AvatarImage 
                src="/Professional Headshot Rodolfo compressed.jpg" 
                alt="Better Systems AI"
                className="object-cover object-top"
              />
              <AvatarFallback>BSA</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold mb-2">Better Systems AI</h1>
            <p className="text-muted-foreground">
              Transforming businesses through innovative AI solutions
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            {socialLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="block"
              >
                <Button
                  className={`w-full h-12 ${link.color} text-white`}
                  variant="default"
                >
                  <link.icon className="mr-2 h-5 w-5" />
                  {link.title}
                </Button>
              </a>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Visit our website →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
