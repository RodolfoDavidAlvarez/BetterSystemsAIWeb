import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Partners", href: "/partners" },
  { label: "Contact", href: "/contact" }
];

export default function MobileNav() {
  return (
    <div className="md:hidden flex justify-end">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="relative z-50">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="right-0 left-[auto] w-[min(100%,20rem)]">
          <div className="py-6 px-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-4 px-8 rounded-l-xl hover:bg-accent/10 text-right rtl:text-left"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-6 px-4">
                <Button 
                  asChild 
                  variant="default" 
                  className="w-full justify-end text-right bg-primary hover:bg-primary/90 transition-colors"
                >
                  <Link href="/booking">Book Consultation</Link>
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
