import { Link } from "wouter";
import { Facebook, Linkedin, Youtube } from "lucide-react";
import { BrandX } from "@/components/ui/icons/brand-x";
import { BrandTiktok } from "@/components/ui/icons/brand-tiktok";

const socialLinks = [
  { icon: Linkedin, href: "https://linkedin.com/in/bettersystemsai", label: "LinkedIn" },
  { icon: BrandX, href: "https://x.com/bettersystemsai", label: "X (Twitter)" },
  { icon: Facebook, href: "https://facebook.com/bettersystemsai", label: "Facebook" },
  { icon: BrandTiktok, href: "https://tiktok.com/@bettersystemsai", label: "TikTok" },
  { icon: Youtube, href: "https://youtube.com/bettersystemsai", label: "YouTube" }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-lg mb-4">Better Systems AI</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Transforming businesses through innovative AI solutions. We help companies modernize, 
              optimize, and grow in the digital age.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-muted-foreground hover:text-foreground transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-muted-foreground hover:text-foreground transition-colors">
                  Book Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Get in Touch
                </Link>
              </li>
              <li>
                <Link href="/social" className="text-muted-foreground hover:text-foreground transition-colors">
                  Social Media
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t mt-8 pt-8">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={link.label}
              >
                <link.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>© {currentYear} Better Systems AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}