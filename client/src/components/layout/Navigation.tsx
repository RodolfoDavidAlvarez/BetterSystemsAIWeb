import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import * as React from "react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [location] = useLocation();

  // Function to handle smooth scrolling with header offset
  const scrollToSection = React.useCallback((elementId: string) => {
    if (typeof window === 'undefined') return;
    
    const element = document.getElementById(elementId);
    if (!element) return;

    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + (window?.pageYOffset || window?.scrollY || 0) - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
    setIsMenuOpen(false);
  }, []);

  // Check if we're on the homepage and it's client-side
  const isHomePage = React.useMemo(
    () => location === "/" && typeof window !== 'undefined',
    [location]
  );

  const navItems = React.useMemo(() => [
    { label: "Home", href: "/", isExternal: true },
    { label: "Services", href: "#services", id: "services", isHash: true },
    { label: "About", href: "#about", id: "about", isHash: true },
    { label: "Partners", href: "#partners", id: "partners", isHash: true },
    { label: "Contact", href: "#contact", id: "contact", isHash: true },
  ], []);

  const handleNavigation = React.useCallback((item: typeof navItems[0], e: React.MouseEvent) => {
    if (!item.isHash) return;
    
    e.preventDefault();
    if (!isHomePage) {
      window.location.href = `/${item.href}`;
    } else {
      scrollToSection(item.id!);
    }
    setIsMenuOpen(false);
  }, [isHomePage, scrollToSection]);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!isMenuOpen || typeof window === 'undefined') return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-navigation-menu]')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on route change
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/20 to-background/80" />
        <div className="container relative mx-auto px-4" data-navigation-menu>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="font-bold text-lg md:text-xl truncate max-w-[200px] md:max-w-none relative">
              Better Systems AI
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.isHash ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer px-3 py-2 rounded-md hover:bg-accent/10"
                      onClick={(e) => handleNavigation(item, e)}
                      aria-label={`Navigate to ${item.label} section`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent/10 block"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <Button asChild variant="default">
                <Link href="/booking">Book Consultation</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -mr-2 relative z-50"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
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
              <div className="relative flex flex-col gap-1.5 rounded-lg bg-background/95 p-4">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-zinc-50/30 to-white/90 dark:from-zinc-900/30 dark:to-zinc-900/90" />
                {navItems.map((item) => (
                  item.isHash ? (
                    <button
                      key={item.label}
                      className="relative text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200 px-6 py-2.5 rounded-md w-full text-right bg-transparent border-none cursor-pointer"
                      onClick={(e) => handleNavigation(item, e)}
                      aria-label={`Navigate to ${item.label} section`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="relative text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200 px-6 py-2.5 rounded-md w-full text-right"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
                <Button asChild variant="default" className="relative w-full mt-2">
                  <Link href="/booking" onClick={() => setIsMenuOpen(false)}>Book Consultation</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
