import { motion } from "framer-motion";
import { LineChart, Clock, DollarSign, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save Time",
    description: "Automate repetitive tasks and streamline workflows to reclaim valuable hours"
  },
  {
    icon: DollarSign,
    title: "Reduce Costs",
    description: "Optimize operations and minimize overhead through intelligent automation"
  },
  {
    icon: LineChart,
    title: "Improve Efficiency",
    description: "Make data-driven decisions with real-time insights and analytics"
  },
  {
    icon: TrendingUp,
    title: "Drive Growth",
    description: "Scale your business with AI-powered solutions that adapt to your needs"
  }
];

export default function WhatWeDo() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">What We Do</h2>
          <p className="text-lg text-muted-foreground">
            We help businesses harness the power of AI to transform their operations,
            boost productivity, and achieve sustainable growth through innovative solutions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <benefit.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
