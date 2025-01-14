import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Partners", href: "/partners" },
  { label: "Contact", href: "/contact" }
];

export default function DesktopNav() {
  return (
    <div className="hidden md:flex items-center space-x-4">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent/10"
        >
          {item.label}
        </Link>
      ))}
      <Button asChild variant="default">
        <Link href="/booking">Book Consultation</Link>
      </Button>
    </div>
  );
}
