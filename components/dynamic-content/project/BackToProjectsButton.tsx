"use client";

import { useCallback } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  fallbackHref?: Route;
  className?: string;
};

export default function BackToProjectsButton({
  fallbackHref = "/project" as Route,
  className,
}: Props) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (typeof window === "undefined") return;

    const hasHistory = window.history.length > 1;
    if (hasHistory) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 text-slate-500 hover:underline",
        className
      )}
      aria-label="Back to Project Gallery"
    >
      <ArrowLeft className="icon-affordance h-4 w-4" aria-hidden="true" />
      <span>Back</span>
    </button>
  );
}
