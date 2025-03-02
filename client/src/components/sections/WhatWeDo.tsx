import { motion } from "framer-motion";
import { LineChart, Clock, DollarSign, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save Time",
    description: "Allocate valuable employee time to productive tasks while AI handles repetitive work"
  },
  {
    icon: DollarSign,
    title: "Reduce Costs",
    description: "Lower operational costs through significant automation of manual and redundant processes"
  },
  {
    icon: LineChart,
    title: "Improve Efficiency",
    description: "Streamline operations to increase productivity and deliver better quality of service"
  },
  {
    icon: TrendingUp,
    title: "Drive Growth",
    description: "Leverage cost reductions and productivity gains to create exponential business growth"
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
          <p className="text-lg text-muted-foreground mb-4">
            We help businesses harness the power of AI to transform their operations,
            boost productivity, and achieve sustainable growth through innovative solutions.
          </p>
          <p className="text-lg text-muted-foreground">
            Our approach combines personalized solutions with holistic assessment of your unique business needs,
            identifying inefficiencies and integrating seamless technology that requires minimal learning curves.
            We become your dedicated technology partner, continuously looking out for your business and keeping 
            you ahead of technological advancements.
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
