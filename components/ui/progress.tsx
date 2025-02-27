"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  color?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, color, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 bg-primary transition-all", color)}
          style={{ 
            transform: `translateX(-${100 - (value || 0)}%)`
          }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }