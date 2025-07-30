
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { toTitleCase } from "@/lib/utils";
import { fetchVerse } from "@/lib/api";
import { useState, useEffect } from "react";
import { Skeleton } from "../ui/skeleton";

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

interface ConcordanceItem {
    target: string;
    text: string | null;
    loading: boolean;
}

export function ConcordanceDialog({ isOpen, onOpenChange, verseInfo }: ConcordanceDialogProps) {
  const { book, chapter, verse, text, references = [], version: currentVersion } = verseInfo;
  const [concordanceItems, setConcordanceItems] = useState<ConcordanceItem[]>([]);

  useEffect(() => {
    if (!isOpen) {
        setConcordanceItems([]);
        return;
    };
    
    if (references.length > 0) {
        setConcordanceItems(references.map(ref => ({ target: ref.target, text: null, loading: true })));

        references.forEach(async (ref, index) => {
            const [bookName, chapterAndVerse] = ref.target.split(' ');
            const [refChapter, refVerse] = chapterAndVerse.split(':').map(Number);
            
            const verseText = await fetchVerse(currentVersion, bookName, refChapter, refVerse);
            
            setConcordanceItems(prev => {
                const newItems = [...prev];
                newItems[index] = { ...newItems[index], text: verseText, loading: false };
                return newItems;
            });
        });
    }
  }, [isOpen, references, currentVersion]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Concordancia Bíblica</DialogTitle>
          <DialogDescription>
            Referencias cruzadas para {toTitleCase(book)} {chapter}:{verse}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
                <Card className="bg-primary/10 border-primary/50">
                    <CardContent className="p-4">
                        <p className="font-bold text-readable text-primary">{toTitleCase(book)} {chapter}:{verse}</p>
                        <p className="mt-1 text-readable">{text}</p>
                    </CardContent>
                </Card>
            
                <div className="mt-4 space-y-4">
                    {concordanceItems.length > 0 ? (
                       concordanceItems.map((item, index) => (
                        <div key={index} className="p-4 rounded-lg bg-secondary/50">
                            <h4 className="font-bold text-lg font-headline text-primary">{item.target}</h4>
                            {item.loading ? (
                                <div className="space-y-2 mt-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            ) : (
                                <p className="mt-1 text-readable">{item.text || "No se pudo cargar el texto."}</p>
                            )}
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
