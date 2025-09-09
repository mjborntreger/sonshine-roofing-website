'use client';
import { motion, useReducedMotion, type Easing } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type TransitionVariant =
  | 'fade'
  | 'zoom'
  | 'slideUp'
  | 'slideRight'
  | 'blur'
  | 'clip'
  | 'none';

type VariantDef = { initial: Record<string, any>; animate: Record<string, any> };

type Props = {
  children: React.ReactNode;
  variant?: TransitionVariant;
  duration?: number;
  ease?: Easing | Easing[];
};

export default function PageTransition({
  children,
  variant = 'zoom',
  duration = 0.35,
  ease = [0.4, 0, 0.2, 1] as const,
}: Props) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const variants: VariantDef = useMemo(() => {
    switch (variant) {
      case 'fade':
        return { initial: { opacity: 0 }, animate: { opacity: 1 } };
      case 'zoom':
        return { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 } };
      case 'slideUp':
        return { initial: { opacity: 1, y: 0 }, animate: { opacity: 0, y: 20 } };
      case 'slideRight':
        return { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 } };
      case 'blur':
        return {
          initial: { opacity: 0, filter: 'blur(8px)' },
          animate: { opacity: 1, filter: 'blur(0px)' },
        };
      case 'clip':
        return {
          initial: { clipPath: 'inset(0 0 100% 0)' },
          animate: { clipPath: 'inset(0 0 0% 0)' },
        };
      case 'none':
      default:
        return { initial: {}, animate: {} };
    }
  }, [variant]);

  if (reduce) return <div>{children}</div>;
  if (!mounted) return <div style={{ opacity: 0 }}>{children}</div>;

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      transition={{ duration, ease }}
      style={{ willChange: 'opacity, transform, filter, clip-path' }}
    >
      {children}
    </motion.div>
  );
}
