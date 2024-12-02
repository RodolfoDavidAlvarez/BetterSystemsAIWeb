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
    if (this.state.hasError) {
      return this.props.children;
    }
    return this.props.children;
  }
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const [location] = useLocation();

  return (
    <PageTransitionErrorBoundary>
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.2,
            ease: "easeInOut"
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionErrorBoundary>
  );
};

export default PageTransition;
