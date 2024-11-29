import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/Footer";
import Navigation from "@/components/sections/Navigation";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
