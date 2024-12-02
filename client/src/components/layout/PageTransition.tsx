import React, { ReactNode } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

class PageTransitionErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Page transition error:", error);
  }

  render() {
    return this.props.children;
  }
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const [location] = useLocation();

  return (
    <PageTransitionErrorBoundary>
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            mass: 0.5,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            willChange: 'transform, opacity',
            isolation: 'isolate'
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionErrorBoundary>
  );
};

export { PageTransition };
