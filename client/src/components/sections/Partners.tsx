import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const partners = [
  {
    name: "Soil Seed and Water",
    logo: "/SSW Logo.png",
    description: "SSW focuses on sustainable agriculture solutions by providing high-quality composting products, enhancing soil health, and supporting eco-friendly farming practices."
  },
  {
    name: "Agave Environmental Contracting, Inc.",
    logo: "/AEC-Horizontal-Official-Logo-2020.png",
    description: "Agave Environmental Contracting, Inc. provides expert landscaping services with 34+ years of experience and 6,000+ completed projects"
  },
  {
    name: "HITA of Arizona",
    logo: "/partner-hita.png",
    description: "HITA of Arizona is a leading hospitality and tourism association dedicated to supporting Arizona's vibrant hospitality industry through advocacy, education, and networking."
  }
];

export default function Partners() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextPartner = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % partners.length);
  };

  const prevPartner = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + partners.length) % partners.length);
  };

  // Auto-rotate carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      nextPartner();
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section id="partners" className="py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Collaborating with industry leaders to deliver comprehensive AI solutions.
          </p>
        </div>

        <div 
          className="relative max-w-4xl mx-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Arrows */}
          <button
            onClick={prevPartner}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary text-white rounded-full p-4 shadow-xl hover:bg-primary/90 hover:scale-110 transition-all -translate-x-6 md:-translate-x-16"
            aria-label="Previous partner"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <button
            onClick={nextPartner}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary text-white rounded-full p-4 shadow-xl hover:bg-primary/90 hover:scale-110 transition-all translate-x-6 md:translate-x-16"
            aria-label="Next partner"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Carousel Container */}
          <div className="relative h-[400px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full"
              >
                <Card className="shadow-lg border hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="h-32 flex items-center justify-center mb-6 bg-white rounded-lg p-6">
                      <img
                        src={partners[currentIndex].logo}
                        alt={partners[currentIndex].name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/400x200?text=' + encodeURIComponent(partners[currentIndex].name);
                        }}
                      />
                    </div>
                    <h3 className="text-2xl font-semibold text-center mb-4">{partners[currentIndex].name}</h3>
                    <p className="text-muted-foreground text-center text-lg">{partners[currentIndex].description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {partners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? "bg-primary w-8" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to partner ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}