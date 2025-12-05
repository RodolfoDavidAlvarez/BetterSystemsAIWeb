import Footer from "@/components/sections/Footer";
import Navigation from "@/components/layout/Navigation";
import { useLocation } from "wouter";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [location] = useLocation();
  const isContactCard = location === "/rodolfo";

  return (
    <div className="min-h-screen flex flex-col">
      {!isContactCard && <Navigation />}
      <main className={isContactCard ? "flex-1" : "flex-1 pt-16"}>
        {children}
      </main>
      {!isContactCard && <Footer />}
    </div>
  );
}
