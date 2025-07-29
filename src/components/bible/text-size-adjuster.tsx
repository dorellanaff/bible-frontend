
"use client"

import { Minus, Plus, Text } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface TextSizeAdjusterProps {
  value: number;
  onChange: (value: number) => void;
}

export function TextSizeAdjuster({ value, onChange }: TextSizeAdjusterProps) {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Adjust text size">
          <Text className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <span className="text-sm font-medium text-muted-foreground">Adjust Font Size</span>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4" />
            <Slider
              min={0.8}
              max={1.5}
              step={0.1}
              value={[value]}
              onValueChange={handleSliderChange}
              aria-label="Text size"
            />
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
