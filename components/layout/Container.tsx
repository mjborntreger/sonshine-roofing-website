import { THEME } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("mx-auto px-2 md:px-4 lg:px-4", THEME.spacing.container, className)}>
      {children}
    </div>
  );
}
