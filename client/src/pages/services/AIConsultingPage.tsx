import { motion } from 'framer-motion';
import { fadeIn, staggerChildren } from '@/lib/animations';
import { BrainCircuit, LineChart, Users } from 'lucide-react'; // Removed unused imports
import type { LucideIcon } from 'lucide-react';

interface ServiceMetric {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export default function AIConsultingPage() {
  const metrics: ServiceMetric[] = [
    {
      value: "90%",
      label: "Cost Reduction",
      description: "Through AI-driven process optimization",
      icon: DollarSignIcon // Ensure you are using the icons that are imported
    },
    {
      value: "24/7",
      label: "AI Operations",
      description: "Continuous monitoring and optimization",
      icon: ClockIcon
    },
    {
      value: "40%",
      label: "Efficiency Boost",
      description: "Average productivity increase with AI",
      icon: GaugeIcon
    }
  ];

  const features: ServiceFeature[] = [
    // Define your features here...
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-4xl mx-auto mb-16"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <h1 className="text-5xl font-bold mb-4">AI Consulting & Future-Proofing</h1>
        {/* other contents */}
      </motion.div>
    </div>
  );
}