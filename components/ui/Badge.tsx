import { cn } from "@/lib/utils";

export default function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-brand-blue/10 text-brand-blue px-2.5 py-1 text-xs font-medium")}>
      {children}
    </span>
  );
}
