"use client";

import { Suspense } from "react";
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
  return (
    <div>
      <Suspense fallback={<LeadFormFallback />}>
        <LeadForm />
      </Suspense>
    </div>
  );
}
