
"use client"

import * as React from 'react'
import Link from 'next/link'
import { ChevronsUpDown } from 'lucide-react'
import { VersionSelector } from './version-selector'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import type { BibleVersion, Book } from '@/lib/bible-data'
import { ReadingProgressBar } from './reading-progress-bar'
import { useIsMobile } from '@/hooks/use-mobile'
import { SettingsMenu } from './settings-menu'


interface AppHeaderProps extends Omit<VersionSelectorProps, 'selectedVersion' | 'onVersionChange'> {
  book: Book | null;
  chapter: number | null;
  textSize: number;
  onTextSizeChange: (size: number) => void;
  isReading?: boolean;
  onBookSelect: () => void;
  onChapterSelect: () => void;
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  readingProgress: number;
}

export function AppHeader({ 
  book, 
  chapter,
  textSize, 
  onTextSizeChange, 
  isReading = false, 
  onBookSelect, 
  onChapterSelect,
  readingProgress, 
  ...versionProps 
}: AppHeaderProps) {
  const isMobile = useIsMobile();
  
  const showReadingNav = isMobile && isReading && book && chapter;

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="w-1/3 flex items-center gap-2">
             <VersionSelector {...versionProps} />
          </div>
          
          <div className="w-1/3 text-center">
             {showReadingNav ? (
                <div className="flex items-center justify-center gap-2">
                  <Button variant="ghost" onClick={onBookSelect} className="font-headline font-bold text-lg p-1 h-auto truncate flex items-center gap-1">
                      <span>{book.name}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                  <Button variant="ghost" onClick={onChapterSelect} className="font-headline font-bold text-lg p-1 h-auto flex items-center gap-1">
                      <span>{chapter}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </div>
             ) : (
               <Link href="/" className="cursor-pointer">
                <h1 className="text-xl sm:text-2xl font-headline font-bold text-foreground truncate">
                  Biblia
                </h1>
               </Link>
             )}
          </div>

          <div className="w-1/3 flex justify-end items-center gap-2">
            <SettingsMenu textSize={textSize} onTextSizeChange={onTextSizeChange} />
          </div>
        </div>
      </div>
       <ReadingProgressBar progress={readingProgress} />
    </header>
  )
}
