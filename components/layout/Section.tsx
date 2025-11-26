import Container from "./Container";
import { cn } from "@/lib/utils";

export default function Section({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("py-6 md:py-12", className)}>
      <Container>{children}</Container>
    </section>
  );
}
