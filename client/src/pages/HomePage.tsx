import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Partners from "@/components/sections/Partners";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main>
        <Hero />
        <Services />
        <About />
        <Partners />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
