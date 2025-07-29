"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from "react";
import { BibleVersion, VerseData } from "@/lib/bible-data";

interface ConcordanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  verseInfo: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    version: BibleVersion;
  };
}

// Datos de ejemplo para la concordancia
const getConcordanceData = (book: string, chapter: number, verse: number) => {
    // Simulación: encontrar versículos que contengan la palabra "Dios" o "Señor"
    const relatedVerses = [
        { book: 'Juan', chapter: 3, verse: 16, text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna." },
        { book: 'Génesis', chapter: 1, verse: 1, text: "En el principio creó Dios los cielos y la tierra." },
        { book: 'Salmos', chapter: 23, verse: 1, text: "El Señor es mi pastor, nada me falta." },
        { book: 'Isaías', chapter: 40, verse: 31, text: "pero los que esperan en el Señor renovarán sus fuerzas." },
    ];

    return {
        relatedVerses
    }
}

export function ConcordanceDialog({ isOpen, onOpenChange, verseInfo }: ConcordanceDialogProps) {
  const { book, chapter, verse, text } = verseInfo;
  const { relatedVerses } = getConcordanceData(book, chapter, verse);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Concordancia Bíblica</DialogTitle>
          <DialogDescription>
            Versículos relacionados con {book} {chapter}:{verse}
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
                    {relatedVerses.map((item, index) => (
                        <div key={index} className="p-4 rounded-lg bg-secondary/50">
                            <h4 className="font-bold text-lg font-headline text-primary">{item.book} {item.chapter}:{item.verse}</h4>
                            <p className="mt-1 text-readable">{item.text || "Versículo no disponible."}</p>
                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
