import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-blue text-white hover:opacity-90 focus-visible:ring-brand-blue",
        secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
        outline: "border border-slate-300 text-slate-900 hover:bg-slate-50",
        ghost: "hover:bg-slate-200 text-slate-900",
        link: "text-brand-blue underline-offset-4 hover:underline",
        brandBlue: "bg-[var(--brand-blue)] text-white hover:opacity-90 focus-visible:ring-[var(--brand-blue)] transition duration-500 ease-in-out",
        brandOrange: "bg-[var(--brand-orange)] text-white hover:opacity-90 focus-visible:ring-[var(--brand-orange)] transition duration-500 ease-in-out",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-full px-3",
        lg: "h-11 rounded-full px-6",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className, variant, size, asChild = false, ...props
}, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
