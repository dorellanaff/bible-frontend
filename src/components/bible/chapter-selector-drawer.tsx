
"use client"

import * as React from 'react'
import type { Book } from '@/lib/bible-data'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft } from 'lucide-react'

interface ChapterSelectorDrawerProps {
  book: Book;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChapterSelect: (chapter: number) => void;
  selectedChapter: number | null;
  onGoBack: () => void;
}

export function ChapterSelectorDrawer({ book, isOpen, onOpenChange, onChapterSelect, selectedChapter, onGoBack }: ChapterSelectorDrawerProps) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const handleBack = () => {
    onGoBack();
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh] flex flex-col">
        <DrawerHeader className="text-left flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={handleBack}>
              <ArrowLeft className="h-6 w-6" />
              <span className="sr-only">Volver</span>
            </Button>
            <div>
              <DrawerTitle className="font-headline text-2xl">Seleccionar Capítulo</DrawerTitle>
              <DrawerDescription>
                {book.name}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto flex-grow" ref={scrollRef}>
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 gap-2 p-4 pt-0">
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
