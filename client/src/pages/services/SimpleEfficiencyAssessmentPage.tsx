import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Link } from "wouter";
import SimpleEfficiencyAssessmentForm from "@/components/sections/SimpleEfficiencyAssessmentForm";

export default function SimpleEfficiencyAssessmentPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services/efficiency-audit" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Efficiency Audit
        </Link>
        <h1 className="text-4xl font-bold mb-4">Quick Efficiency Assessment</h1>
        <p className="text-lg text-muted-foreground">
          Help us understand your business needs in just a few simple steps. Tell us about your current challenges and goals, and we'll show you how we can help improve your efficiency.
        </p>
      </motion.div>

      <SimpleEfficiencyAssessmentForm />
    </div>
  );
}
