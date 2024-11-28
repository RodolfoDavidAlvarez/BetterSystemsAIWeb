import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Github, Linkedin, Twitter, CalendarDays } from "lucide-react";

const socialLinks = [
  {
    title: "LinkedIn",
    href: "https://linkedin.com/in/bettersystemsai",
    icon: Linkedin,
    color: "bg-[#0077B5] hover:bg-[#006399]",
  },
  {
    title: "GitHub",
    href: "https://github.com/bettersystemsai",
    icon: Github,
    color: "bg-[#333] hover:bg-[#24292e]",
  },
  {
    title: "Twitter",
    href: "https://twitter.com/bettersystemsai",
    icon: Twitter,
    color: "bg-[#1DA1F2] hover:bg-[#1a91da]",
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
      <div className="w-full max-w-md space-y-8">
        {/* Profile Section */}
        <div className="text-center">
          <Avatar className="h-32 w-32 mx-auto mb-4">
            <AvatarImage src="/rodolfo-portrait.jpg" alt="Better Systems AI" />
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
      </div>
    </div>
  );
}
