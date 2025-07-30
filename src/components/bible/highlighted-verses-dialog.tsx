
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from "react";
import { HighlightedVerse } from "@/lib/db";
import { Book } from "@/lib/bible-data";
import { Skeleton } from "../ui/skeleton";
import { toTitleCase } from "@/lib/utils";

interface HighlightedVersesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
  getHighlightedVersesForBook: (bookName: string) => Promise<HighlightedVerse[]>;
  onNavigate: (verse: HighlightedVerse) => void;
}


export function HighlightedVersesDialog({ isOpen, onOpenChange, book, getHighlightedVersesForBook, onNavigate }: HighlightedVersesDialogProps) {
    const [verses, setVerses] = useState<HighlightedVerse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && book) {
            setIsLoading(true);
            getHighlightedVersesForBook(book.name)
                .then(setVerses)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, book, getHighlightedVersesForBook]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Versículos Resaltados</DialogTitle>
          <DialogDescription>
            Mostrando versículos resaltados de {toTitleCase(book.name)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                ) : verses.length > 0 ? (
                    verses.map((item) => (
                        <Card 
                            key={item.id} 
                            className="cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={() => onNavigate(item)}
                            style={{ borderLeft: `4px solid ${item.color}`}}
                        >
                            <CardContent className="p-4">
                                <p className="font-bold text-readable text-primary">{toTitleCase(item.book)} {item.chapter}:{item.verse} ({item.version})</p>
                                <p className="mt-1 text-readable">{item.text}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground p-8">
                        No hay versículos resaltados en este libro.
                    </div>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
