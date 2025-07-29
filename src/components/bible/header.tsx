
"use client"

import type * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { TextSizeAdjuster } from './text-size-adjuster'
import { VersionSelector } from './version-selector'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import type { BibleVersion } from '@/lib/bible-data'


interface AppHeaderProps {
  textSize: number;
  onTextSizeChange: (size: number) => void;
  showBack?: boolean;
  onBack?: () => void;
  versions: BibleVersion[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onDownload: (version: string) => void;
  onDelete: (version: string) => void;
  isVersionDownloaded: (version: string, markAsDownloading?: boolean) => Promise<boolean>;
}

export function AppHeader({ textSize, onTextSizeChange, showBack = false, onBack, ...versionProps }: AppHeaderProps) {
  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="w-1/3 flex items-center gap-2">
            {showBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Volver</span>
              </Button>
            )}
             <VersionSelector {...versionProps} />
          </div>
          <div className="w-1/3 text-center">
             <h1 className={cn(
              "text-2xl sm:text-3xl font-headline font-bold text-foreground truncate",
              { "hidden sm:block": showBack }
            )}>
              Biblia
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
