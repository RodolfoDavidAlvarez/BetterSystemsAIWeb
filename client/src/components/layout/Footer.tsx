import { Link } from "wouter";
import { Facebook, Mail, Phone } from "lucide-react";
import { BrandX } from "@/components/ui/icons/brand-x";
import { BrandTiktok } from "@/components/ui/icons/brand-tiktok";

const socialLinks = [
  { icon: BrandX, href: "https://x.com/bettersystemsai", label: "X (Twitter)" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61568467651639", label: "Facebook" },
  { icon: Mail, href: "mailto:ralvarez@soilseedandwater.com", label: "Email" },
  { icon: Phone, href: "tel:+19285501649", label: "Phone" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background mt-auto">
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
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#partners" className="text-muted-foreground hover:text-foreground transition-colors">
                  Partners
                </a>
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
                <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Get in Touch
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        {/* Social Links */}
        <div className="mt-16 py-8">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
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