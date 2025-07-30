
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'

interface ConcordanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  verseInfo: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    version: string;
    references?: { source: string; target: string }[];
  };
}

export function ConcordanceDialog({ isOpen, onOpenChange, verseInfo }: ConcordanceDialogProps) {
  const { book, chapter, verse, text, references = [] } = verseInfo;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Concordancia Bíblica</DialogTitle>
          <DialogDescription>
            Referencias cruzadas para {book} {chapter}:{verse}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
                <Card className="bg-primary/10 border-primary/50">
                    <CardContent className="p-4">
                        <p className="font-bold text-readable text-primary">{book} {chapter}:{verse}</p>
                        <p className="mt-1 text-readable">{text}</p>
                    </CardContent>
                </Card>
            
                <div className="mt-4 space-y-4">
                    {references.length > 0 ? (
                       references.map((item, index) => (
                        <div key={index} className="p-4 rounded-lg bg-secondary/50">
                            <h4 className="font-bold text-lg font-headline text-primary">{item.target}</h4>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-lg bg-secondary/50 text-center text-muted-foreground">
                        No se encontraron referencias para este versículo.
                      </div>
                    )}
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
