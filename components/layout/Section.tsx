import Container from "./Container";
import { cn } from "@/lib/utils";

export default function Section({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("py-12 md:py-16", className)}>
      <Container>{children}</Container>
    </section>
  );
}
