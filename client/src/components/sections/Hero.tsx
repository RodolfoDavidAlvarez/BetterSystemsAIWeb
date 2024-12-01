import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="pt-20 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Bring Your Business Into the AI Era
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              We make it easy for businesses to use AI to save time, cut costs, and grow.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href="/get-started">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/booking">Book Consultation</a>
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
              className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 w-2/3 max-w-[300px] z-10"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&auto=format&fit=crop&q=80"
                  alt="Rising profit graph showing business growth and success"
                  className="rounded-lg shadow-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-lg" />
                <div className="absolute bottom-2 left-2 bg-background/90 px-3 py-1 rounded text-sm font-medium">
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
