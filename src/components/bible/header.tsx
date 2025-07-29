
"use client"

import type * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { TextSizeAdjuster } from './text-size-adjuster'
import { Button } from '../ui/button'

interface AppHeaderProps {
  textSize: number;
  onTextSizeChange: (size: number) => void;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppHeader({ textSize, onTextSizeChange, showBack = false, onBack }: AppHeaderProps) {
  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="w-1/3">
            {showBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Volver</span>
              </Button>
            )}
          </div>
          <div className="w-1/3 text-center">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
              Biblia Viva
            </h1>
          </div>
          <div className="w-1/3 flex justify-end">
            <TextSizeAdjuster value={textSize} onChange={onTextSizeChange} />
          </div>
        </div>
      </div>
    </header>
  )
}
