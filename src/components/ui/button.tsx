import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-green-500 text-black hover:bg-green-600 shadow-lg shadow-green-500/20",
        destructive:
          "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30",
        outline:
          "border border-emerald-500/40 bg-white/5 text-emerald-200 hover:bg-white/10",
        secondary:
          "bg-white/10 text-white hover:bg-white/20",
        ghost: "text-white hover:bg-white/10",
        link: "text-green-400 underline-offset-4 hover:underline",
        glass:
          "backdrop-blur-xl bg-white/[0.02] border border-green-800/30 text-green-300 hover:border-green-700/50 hover:bg-white/[0.05]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
