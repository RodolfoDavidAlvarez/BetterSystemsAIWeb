import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';

export const useScrollToTop = () => {
  const [location] = useLocation();
  const previousLocation = useRef(location);

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, []);

  useEffect(() => {
    if (previousLocation.current !== location) {
      scrollToTop();
      previousLocation.current = location;
    }
  }, [location, scrollToTop]);

  // Cleanup function
  useEffect(() => {
    return () => {
      previousLocation.current = '';
    };
  }, []);
};
