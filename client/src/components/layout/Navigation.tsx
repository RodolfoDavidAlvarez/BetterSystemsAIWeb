import { Link } from "wouter";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

export default function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50 border-b border-border/10 transition-all duration-200">
      <nav className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/logo-transparent.png" 
              alt="Better Systems AI Logo" 
              className="h-20 w-auto object-contain" 
            />
          </Link>

          {/* Desktop Navigation */}
          <DesktopNav />

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}