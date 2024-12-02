import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 15 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
            opacity: { duration: 0.35 },
            y: { duration: 0.5, ease: [0.33, 1, 0.68, 1] }
          }
        }}
        exit={{ 
          opacity: 0,
          y: -8,
          transition: {
            duration: 0.3,
            ease: [0.4, 0, 1, 1],
            opacity: { duration: 0.25 }
          }
        }}
        className="w-full relative"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
