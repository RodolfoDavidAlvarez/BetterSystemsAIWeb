import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Simplified navigation items
const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Partners", href: "/partners" },
  { label: "Contact", href: "/contact" }
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50 border-b border-border/10 transition-all duration-200">
      <nav className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/logo-transparent.png" 
              alt="Better Systems AI Logo" 
              className="h-16 w-auto object-contain" 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
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

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex md:hidden items-center justify-center p-2 rounded-md text-foreground hover:bg-accent/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Open menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden transition-all duration-200 ease-in-out",
            isOpen ? "h-auto opacity-100" : "h-0 opacity-0 overflow-hidden"
          )}
        >
          <div className="space-y-1 pb-3 pt-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="px-3 py-2">
              <Button
                asChild
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                <Link href="/booking">Book Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}