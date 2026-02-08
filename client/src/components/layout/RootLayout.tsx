import Footer from "@/components/sections/Footer";
import Navigation from "@/components/layout/Navigation";
import { useLocation } from "wouter";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [location] = useLocation();
  const isContactCard = location === "/rodolfo";
  const isPaymentPage = location.startsWith("/pay/");

  return (
    <div className="min-h-screen flex flex-col">
      {!isContactCard && !isPaymentPage && <Navigation />}
      <main className={isContactCard || isPaymentPage ? "flex-1" : "flex-1 pt-16"}>
        {children}
      </main>
      {!isContactCard && !isPaymentPage && <Footer />}
    </div>
  );
}
