import { useEffect, useRef, useState } from "react";

/**
 * Utility hook to make throttle function call
 */
export function useThrottle<T>(value: T, interval = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [initialTimestamp] = useState(() => Date.now());
  const lastExecutedRef = useRef<number>(initialTimestamp);

  useEffect(() => {
    if (Date.now() >= lastExecutedRef.current + interval) {
      lastExecutedRef.current = Date.now();
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecutedRef.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}
