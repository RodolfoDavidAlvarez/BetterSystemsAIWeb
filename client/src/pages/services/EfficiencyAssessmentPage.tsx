import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Link } from "wouter";
import EfficiencyAssessmentForm from "@/components/sections/EfficiencyAssessmentForm";

export default function EfficiencyAssessmentPage() {
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
        <h1 className="text-4xl font-bold mb-4">Efficiency Assessment</h1>
        <p className="text-lg text-muted-foreground">
          Complete this brief assessment to help us understand your business needs and how we can help you improve efficiency and reduce costs.
        </p>
      </motion.div>

      <motion.div
        className="max-w-3xl mx-auto"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <div className="bg-card rounded-lg shadow-sm border p-8">
          <EfficiencyAssessmentForm />
        </div>
      </motion.div>
    </div>
  );
}
