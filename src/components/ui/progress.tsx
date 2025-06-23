
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  scoreValue?: number; // New prop for determining color based on score
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, scoreValue, ...props }, ref) => {
  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-gradient-to-r from-orange-600 to-orange-400';
    if (score >= 6) return 'bg-gradient-to-r from-yellow-600 to-orange-500';
    if (score >= 4) return 'bg-gradient-to-r from-red-600 to-yellow-600';
    return 'bg-gradient-to-r from-gray-600 to-red-600';
  };

  const progressColorClass = scoreValue !== undefined 
    ? getProgressColor(scoreValue) 
    : 'bg-primary';

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", progressColorClass)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
