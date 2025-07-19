"use client"

import { BIBLE_VERSIONS, BIBLE_DATA } from '@/lib/bible-data'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'

interface VerseComparisonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  verseInfo: {
    book: string;
    chapter: number;
    verse: number;
  };
}

export function VerseComparisonDialog({ isOpen, onOpenChange, verseInfo }: VerseComparisonDialogProps) {
  const { book, chapter, verse } = verseInfo;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Comparar Versiones</DialogTitle>
          <DialogDescription>
            {book} {chapter}:{verse}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
            {BIBLE_VERSIONS.map(version => {
                const verseText = BIBLE_DATA[version]?.[book]?.[chapter]?.[verse];
                return (
                <div key={version} className="p-4 rounded-lg bg-secondary/50">
                    <h4 className="font-bold text-lg font-headline text-primary">{version}</h4>
                    <p className="mt-1 text-readable">{verseText || "Versículo no disponible en esta versión."}</p>
                </div>
                )
            })}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
