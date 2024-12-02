import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import * as React from "react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
    { label: "Photo Analysis", href: "/photo-submission" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-lg md:text-xl truncate max-w-[200px] md:max-w-none">
            Better Systems AI
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
            className="md:hidden p-2 -mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 px-2">
            <div className="flex flex-col gap-1.5 rounded-lg bg-background/95 p-4 shadow-sm">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200 px-6 py-2.5 rounded-md w-full text-right"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild variant="default" className="w-full mt-2" onClick={() => setIsMenuOpen(false)}>
                <Link href="/booking">Book Consultation</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
