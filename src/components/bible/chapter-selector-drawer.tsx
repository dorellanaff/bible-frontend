
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
  const chapterRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  chapterRefs.current = chapters.map((_, i) => chapterRefs.current[i] ?? React.createRef<HTMLButtonElement>() as any);


  React.useEffect(() => {
    if (isOpen && selectedChapter) {
      setTimeout(() => {
        const chapterElement = chapterRefs.current[selectedChapter - 1];
        if (chapterElement) {
          chapterElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100); // Small delay to ensure the drawer is fully rendered
    }
  }, [isOpen, selectedChapter]);

  const handleBack = () => {
    onGoBack();
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh] flex flex-col">
        <DrawerHeader className="text-left flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={handleBack}>
              <ArrowLeft className="h-8 w-8" />
              <span className="sr-only">Volver</span>
            </Button>
            <div>
              <DrawerTitle className="font-headline text-2xl">{book.name}</DrawerTitle>
            </div>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto flex-grow">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 gap-2 p-4 pt-0 pb-6">
              {chapters.map((chapter, index) => (
                <Button
                  key={chapter}
                  ref={el => chapterRefs.current[index] = el}
                  variant={selectedChapter === chapter ? 'default' : 'secondary'}
                  onClick={() => onChapterSelect(chapter)}
                  className="w-full justify-start text-lg py-3 h-auto font-headline"
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
