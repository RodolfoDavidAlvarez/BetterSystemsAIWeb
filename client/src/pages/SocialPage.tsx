
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Github, Linkedin, Facebook, Youtube, CalendarDays } from "lucide-react";
import { BrandX } from "@/components/ui/icons/brand-x";
import { BrandTiktok } from "@/components/ui/icons/brand-tiktok";

const socialLinks = [
  {
    title: "LinkedIn",
    href: "https://linkedin.com/in/bettersystemsai",
    icon: Linkedin,
    color: "bg-[#0077B5] hover:bg-[#006399]",
  },
  {
    title: "Facebook",
    href: "https://facebook.com/bettersystemsai",
    icon: Facebook,
    color: "bg-[#1877F2] hover:bg-[#1664D9]",
  },
  {
    title: "X (Twitter)",
    href: "https://x.com/bettersystemsai",
    icon: BrandX,
    color: "bg-black hover:bg-neutral-900",
  },
  {
    title: "TikTok",
    href: "https://tiktok.com/@bettersystemsai",
    icon: BrandTiktok,
    color: "bg-[#000000] hover:bg-[#111111]",
  },
  {
    title: "YouTube",
    href: "https://youtube.com/@bettersystemsai",
    icon: Youtube,
    color: "bg-[#FF0000] hover:bg-[#CC0000]",
  },
  {
    title: "GitHub",
    href: "https://github.com/bettersystemsai",
    icon: Github,
    color: "bg-[#333] hover:bg-[#24292e]",
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
