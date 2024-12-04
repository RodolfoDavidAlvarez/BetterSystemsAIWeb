import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";

export default function CustomSolutionsPage() {
  const service = {
    title: "Custom AI Solutions",
    description: "Have a unique business challenge? We develop tailored AI applications to meet your specific needs.",
    features: [
      "Inventory management systems",
      "Automated contracts and proposal generation",
      "Operational dashboards with real-time data",
      "Automated email content creation",
      "CRM enhancements",
      "Photo & Image Analysis"
    ]
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
        <p className="text-muted-foreground text-lg">
          {service.description}
        </p>
      </motion.div>

      <motion.section 
        className="space-y-8"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-2xl font-semibold">Key Features</h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {service.features.map((feature, index) => (
            <motion.li 
              key={index} 
              className="flex items-center gap-2"
              variants={fadeIn}
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {feature}
            </motion.li>
          ))}
        </ul>
      </motion.section>

      {/* Photo Analysis Demo Section */}
      <motion.section 
        className="mt-16 mb-16 bg-primary/5 rounded-2xl p-8"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-2xl font-semibold mb-4">Try Our Photo Analysis Demo</h2>
        <p className="text-muted-foreground text-lg mb-6">
          Experience the power of our AI-driven photo analysis system. Upload any image and our AI will analyze its contents, 
          providing detailed insights and classifications. This demo showcases just one example of how we can integrate 
          advanced AI capabilities into your business processes.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/photo-submission">Try Photo Analysis Demo</Link>
          </Button>
        </div>
      </motion.section>

      <div className="mt-8 text-center">
        <Button asChild size="lg">
          <Link href="/get-started">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
