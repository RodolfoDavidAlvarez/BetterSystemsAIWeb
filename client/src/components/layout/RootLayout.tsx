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
  const isAdmin = location.startsWith("/admin");
  const hideChrome = isContactCard || isPaymentPage || isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideChrome && <Navigation />}
      <main className={hideChrome ? "flex-1" : "flex-1 pt-16"}>
        {children}
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}
