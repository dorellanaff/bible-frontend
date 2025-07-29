
"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ReadingProgressBarProps {
  progress: number;
}

export function ReadingProgressBar({ progress }: ReadingProgressBarProps) {
  return (
    <div className={cn(
        "absolute bottom-0 left-0 w-full h-[3px] transition-opacity duration-300",
        progress > 0 && progress < 100 ? "opacity-100" : "opacity-0"
    )}>
        <Progress value={progress} className="h-full w-full rounded-none" />
    </div>
  )
}
