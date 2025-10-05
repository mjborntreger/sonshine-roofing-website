"use client";

import { Suspense, useRef } from "react";
import { motion, useInView } from "framer-motion";
import LeadForm from "@/components/LeadForm";

function LeadFormFallback() {
  return (
    <div
      className="mt-8 min-h-[420px] rounded-3xl border border-blue-100 bg-white/70 p-8 shadow-sm"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-slate-500">Loading your guided request form…</p>
    </div>
  );
}

export default function LeadFormSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, {
    once: true,
    margin: "-20% 0px",
  });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{ duration: 0.65, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <Suspense fallback={<LeadFormFallback />}>
        <LeadForm />
      </Suspense>
    </motion.div>
  );
}
