import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="pt-28 pb-12 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
              Your Business, One Step Ahead
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
              Empowering small and medium-sized businesses with innovative AI and automation solutions that 
              drive efficiency, growth, and long-term competitive advantage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button asChild size="lg">
                <Link href="/get-started">Request Solution</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="/images/Cover Photo (Better systems AI).jpg"
                alt="Business professional presenting AI-powered business model sequence and automation strategies to team"
                className="rounded-lg shadow-2xl object-cover h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-lg" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 w-1/2 md:w-2/3 max-w-[200px] md:max-w-[300px] z-10"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&auto=format&fit=crop&q=80"
                  alt="Rising profit graph showing business growth and success"
                  className="rounded-lg shadow-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-lg" />
                <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 bg-background/90 px-2 py-0.5 md:px-3 md:py-1 rounded text-xs md:text-sm font-medium">
                  Increased Profits
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}