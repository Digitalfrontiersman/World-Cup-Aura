import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-condensed text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Gold hero action: lit top edge, brighten on hover. No gradient.
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_0_rgba(0,0,0,0.4)] hover:brightness-[1.06]",
        // Crimson — reserve for genuinely destructive actions.
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:brightness-[1.06]",
        // The standard neutral button: raised surface + hairline, gold on hover.
        outline:
          "border border-card-border bg-surface-2 text-foreground hover:border-primary/40 hover:bg-surface-3",
        secondary:
          "border border-card-border bg-surface-2 text-secondary-foreground hover:bg-surface-3",
        ghost: "border border-transparent text-foreground hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-9 rounded-md px-3.5 text-xs",
        lg: "min-h-13 px-7 text-[0.95rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
