// components/useIntersection.ts
import { useEffect, useRef, useState } from "react";

export function useIntersection<T extends HTMLElement>(
  options: IntersectionObserverInit = { root: null, rootMargin: "400px", threshold: 0 }
) {
  const ref = useRef<T | null>(null);
  const [intersecting, set] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => set(entry.isIntersecting), options);
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [options.root, options.rootMargin, options.threshold]);

  return { ref, intersecting };
}