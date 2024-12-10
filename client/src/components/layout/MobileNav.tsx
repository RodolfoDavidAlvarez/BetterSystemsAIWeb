import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Partners", href: "/partners" },
  { label: "Contact", href: "/contact" },
  { label: "Social", href: "/social" }
];

export default function MobileNav() {
  return (
    <div className="md:hidden">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="px-4 py-6 space-y-3">
            <div className="flex flex-col items-end space-y-2 w-full">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200 px-6 py-3 rounded-md text-right w-full max-w-[280px]"
                >
                  {item.label}
                </Link>
              ))}
              <div className="w-full max-w-[280px] px-6 pt-2">
                <Button asChild variant="default" className="w-full">
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