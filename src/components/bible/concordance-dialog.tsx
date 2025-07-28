"use client"

import { BIBLE_DATA } from '@/lib/bible-data'
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
  };
}

// Datos de ejemplo para la concordancia
const getConcordanceData = (book: string, chapter: number, verse: number) => {
    const originalVerseText = BIBLE_DATA['NVI']?.[book]?.[chapter]?.[verse] || "Texto no encontrado."
    
    // Simulación: encontrar versículos que contengan la palabra "Dios" o "Señor"
    const relatedVerses = [
        { book: 'Juan', chapter: 3, verse: 16, text: BIBLE_DATA['NVI']['Juan'][3][16] },
        { book: 'Génesis', chapter: 1, verse: 1, text: BIBLE_DATA['NVI']['Génesis'][1][1] },
        { book: 'Salmos', chapter: 23, verse: 1, text: "El Señor es mi pastor, nada me falta." }, // Ejemplo estático
        { book: 'Isaías', chapter: 40, verse: 31, text: "pero los que esperan en el Señor renovarán sus fuerzas." }, // Ejemplo estático
    ];

    return {
        originalVerseText,
        relatedVerses
    }
}

export function ConcordanceDialog({ isOpen, onOpenChange, verseInfo }: ConcordanceDialogProps) {
  const { book, chapter, verse } = verseInfo;
  const { originalVerseText, relatedVerses } = getConcordanceData(book, chapter, verse);

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
                        <p className="mt-1 text-readable">{originalVerseText}</p>
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
