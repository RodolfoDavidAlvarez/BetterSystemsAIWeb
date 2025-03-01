import { useState, useEffect } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface TourOptions {
  defaultStepOptions?: Shepherd.Step.StepOptions;
  useModalOverlay?: boolean;
  exitOnEsc?: boolean;
  confirmCancel?: boolean;
}

interface TourStep {
  id: string;
  attachTo: {
    element: string;
    on: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  };
  title?: string;
  text: string | HTMLElement;
  cancelIcon?: {
    enabled: boolean;
  };
  buttons?: Shepherd.Step.StepOptionsButton[];
  classes?: string;
  highlightClass?: string;
  scrollTo?: boolean;
  modalOverlayOpeningPadding?: number;
}

const defaultTourOptions: TourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
    classes: 'shadow-md rounded-lg p-1',
    scrollTo: true
  },
  useModalOverlay: true,
  exitOnEsc: true,
  confirmCancel: true
};

export function useOnboardingTour(
  steps: TourStep[],
  options: TourOptions = defaultTourOptions,
  tourName: string = 'site-tour'
) {
  const [tour, setTour] = useState<Shepherd.Tour | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  // Initialize tour
  useEffect(() => {
    const newTour = new Shepherd.Tour({
      ...defaultTourOptions,
      ...options,
      tourName
    });

    steps.forEach(step => {
      newTour.addStep(step);
    });

    newTour.on('start', () => {
      setIsActive(true);
    });

    newTour.on('complete', () => {
      setIsActive(false);
      localStorage.setItem(`tour-${tourName}-completed`, 'true');
      setHasSeenTour(true);
    });

    newTour.on('cancel', () => {
      setIsActive(false);
      localStorage.setItem(`tour-${tourName}-completed`, 'true');
      setHasSeenTour(true);
    });

    setTour(newTour);

    // Check if user has already seen the tour
    const tourCompleted = localStorage.getItem(`tour-${tourName}-completed`) === 'true';
    setHasSeenTour(tourCompleted);

    return () => {
      if (newTour) {
        newTour.complete();
      }
    };
  }, [steps, options, tourName]);

  // Start the tour
  const startTour = () => {
    if (tour && !isActive) {
      tour.start();
    }
  };

  // Stop the tour
  const stopTour = () => {
    if (tour && isActive) {
      tour.cancel();
    }
  };

  // Reset tour history (for testing)
  const resetTourHistory = () => {
    localStorage.removeItem(`tour-${tourName}-completed`);
    setHasSeenTour(false);
  };

  return {
    tour,
    isActive,
    hasSeenTour,
    startTour,
    stopTour,
    resetTourHistory
  };
}