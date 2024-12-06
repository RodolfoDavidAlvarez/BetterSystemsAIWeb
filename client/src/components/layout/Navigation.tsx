import { Link } from "wouter";
import MobileNav from "./MobileNav";
import DesktopNav from "./DesktopNav";

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <span className="font-bold text-lg md:text-xl">Better Systems AI</span>
          </Link>
          <DesktopNav />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}