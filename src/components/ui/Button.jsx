import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const variants = {
    primary: "bg-white text-black hover:bg-neutral-200",
    secondary: "bg-muted text-white hover:bg-muted/80",
    ghost: "bg-transparent text-white hover:bg-white/10",
    outline: "bg-transparent border border-white/10 text-white hover:bg-white/5",
  }
  
  const sizes = {
    sm: "min-h-10 px-3 py-2 text-xs",
    md: "min-h-11 px-4 py-2 text-sm",
    lg: "min-h-12 px-6 py-3 text-base",
  }

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
