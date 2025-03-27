import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Learn", href: "/learn" },
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
        <DrawerContent className="right-0 w-[min(100%,20rem)]">
          <div className="py-6 px-2">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <div key={item.label} className="flex justify-end w-full">
                  <Link
                    href={item.href}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-4 px-6 rounded-l-2xl hover:bg-accent/10 w-[85%] text-right"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}