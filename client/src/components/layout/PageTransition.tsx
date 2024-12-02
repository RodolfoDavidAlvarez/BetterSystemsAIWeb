import React from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.1,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          willChange: 'opacity',
          isolation: 'isolate'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
