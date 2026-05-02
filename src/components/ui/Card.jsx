import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm text-neutral-50 shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }
