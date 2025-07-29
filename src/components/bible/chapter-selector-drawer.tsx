
"use client"

import * as React from 'react'
import type { Book } from '@/lib/bible-data'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChapterSelectorDrawerProps {
  book: Book;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChapterSelect: (chapter: number) => void;
  selectedChapter: number | null;
}

export function ChapterSelectorDrawer({ book, isOpen, onOpenChange, onChapterSelect, selectedChapter }: ChapterSelectorDrawerProps) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="text-left flex-shrink-0">
          <DrawerTitle className="font-headline text-2xl">Seleccionar Capítulo</DrawerTitle>
          <DrawerDescription>
            {book.name}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto">
          <ScrollArea>
            <div className="flex flex-col space-y-2 p-4 pt-0">
              {chapters.map(chapter => (
                <Button
                  key={chapter}
                  variant={selectedChapter === chapter ? 'default' : 'outline'}
                  onClick={() => onChapterSelect(chapter)}
                  className="w-full justify-center text-base py-3 h-auto"
                >
                  Capítulo {chapter}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
