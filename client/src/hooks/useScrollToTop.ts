import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

export const useScrollToTop = () => {
  const [location] = useLocation();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    scrollToTop();
  }, [location, scrollToTop]);
};
