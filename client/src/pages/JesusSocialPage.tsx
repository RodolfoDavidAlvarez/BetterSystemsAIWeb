import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Facebook, CalendarDays, Mail, Phone, UserPlus } from "lucide-react";
import { BrandX } from "@/components/ui/icons/brand-x";

interface SocialLink {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const socialLinks: SocialLink[] = [
  {
    title: "X (Twitter)",
    href: "https://x.com/placeholder",
    icon: BrandX,
    color: "bg-black hover:bg-neutral-900",
  },
  {
    title: "Facebook",
    href: "https://facebook.com/placeholder",
    icon: Facebook,
    color: "bg-[#1877F2] hover:bg-[#1664D9]",
  },
  {
    title: "Email Us",
    href: "mailto:jesus@bettersystems.ai",
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
    title: "Schedule Meeting",
    href: "https://calendly.com/bettersystemsai-jesus",
    icon: CalendarDays,
    color: "bg-[#006BFF] hover:bg-[#0056CC]",
  },
  {
    title: "Book a Consultation",
    href: "/booking",
    icon: CalendarDays,
    color: "bg-primary hover:bg-primary/90",
  },
];

const JesusSocialPage: React.FC = () => {
  const handleDownloadContact = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Jesus - Better Systems AI
N:;Jesus;Better Systems AI;;
ORG:Better Systems AI
TEL;TYPE=CELL:+1234567890
EMAIL:jesus@bettersystems.ai
END:VCARD`;

    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'jesus_contact.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-16 px-4">
      <Card className="w-full max-w-md border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="space-y-8">
          {/* Profile Section */}
          <div className="text-center">
            <Avatar className="h-40 w-40 mx-auto mb-4">
              <AvatarImage 
                src="/placeholder-avatar.jpg" 
                alt="Jesus - Better Systems AI"
                className="object-cover object-top"
              />
              <AvatarFallback>JB</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold mb-2">Jesus - Better Systems AI</h1>
            <p className="text-muted-foreground mb-4">
              AI Implementation Specialist
            </p>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <p>📍 Phoenix, Arizona</p>
              <p>🌐 Transforming businesses through AI</p>
            </div>
            <Button
              onClick={handleDownloadContact}
              className="mt-4 bg-primary hover:bg-primary/90 text-white"
              variant="default"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Save Contact
            </Button>
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
};

export default JesusSocialPage;