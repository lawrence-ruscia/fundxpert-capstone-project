import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';

interface SmartPollingContextType {
  isTabVisible: boolean;
  isUserActive: boolean;
  globalPausePolling: boolean;
  setGlobalPausePolling: (paused: boolean) => void;
}

const SmartPollingContext = createContext<SmartPollingContextType | undefined>(
  undefined
);

export function SmartPollingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [isUserActive, setIsUserActive] = useState(true);
  const [globalPausePolling, setGlobalPausePolling] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track user activity (mouse, keyboard, touch)
  useEffect(() => {
    const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const resetInactivityTimer = () => {
      setIsUserActive(true);

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, INACTIVITY_THRESHOLD);
    };

    // Initialize timer
    resetInactivityTimer();

    // Listen to user activity events
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  return (
    <SmartPollingContext.Provider
      value={{
        isTabVisible,
        isUserActive,
        globalPausePolling,
        setGlobalPausePolling,
      }}
    >
      {children}
    </SmartPollingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSmartPollingContext() {
  const context = useContext(SmartPollingContext);
  if (!context) {
    throw new Error(
      'useSmartPollingContext must be used within SmartPollingProvider'
    );
  }
  return context;
}
