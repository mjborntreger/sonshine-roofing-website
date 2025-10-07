// components/useIntersection.ts
import { useEffect, useMemo, useRef, useState } from "react";

export function useIntersection<T extends HTMLElement>(
  options: IntersectionObserverInit = { root: null, rootMargin: "400px", threshold: 0 }
) {
  const ref = useRef<T | null>(null);
  const [intersecting, set] = useState(false);

  const opts = useMemo<IntersectionObserverInit>(() => ({
    root: options.root ?? null,
    rootMargin: options.rootMargin ?? "400px",
    threshold: options.threshold ?? 0,
  }), [options.root, options.rootMargin, options.threshold]);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => set(entry.isIntersecting), opts);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [opts]);

  return { ref, intersecting };
}
