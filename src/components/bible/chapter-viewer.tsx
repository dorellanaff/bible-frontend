"use client"

import * as React from 'react'
import { BookOpen, Copy, Droplet, Share2, BookCopy } from 'lucide-react'
import type { Book } from '@/lib/bible-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from "@/hooks/use-toast"

interface ChapterViewerProps {
  book: Book;
  chapter: number;
  content: { [verse: number]: string };
  onCompareVerse: (verse: { book: string; chapter: number; verse: number }) => void;
}

export function ChapterViewer({ book, chapter, content, onCompareVerse }: ChapterViewerProps) {
  const { toast } = useToast()
  const verses = Object.entries(content);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Versículo copiado al portapapeles.",
    })
  }

  return (
    <Card className="bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl md:text-4xl">{book.name} {chapter}</CardTitle>
      </CardHeader>
      <CardContent>
        {verses.length > 0 ? (
          <div className="space-y-4 text-readable">
            {verses.map(([verseNumber, text]) => (
              <p key={verseNumber}>
                <Popover>
                  <PopoverTrigger asChild>
                    <span className="cursor-pointer hover:bg-secondary/50 rounded-md p-1 transition-colors">
                      <strong className="font-bold pr-2">{verseNumber}</strong>
                      {text}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex flex-col text-sm">
                      <Button variant="ghost" className="justify-start p-2" onClick={() => copyToClipboard(`${book.name} ${chapter}:${verseNumber} - ${text}`)}>
                        <Copy className="mr-2 h-4 w-4" /> Copiar
                      </Button>
                      <Separator />
                      <Button variant="ghost" className="justify-start p-2" onClick={() => onCompareVerse({ book: book.name, chapter, verse: parseInt(verseNumber) })}>
                        <BookOpen className="mr-2 h-4 w-4" /> Comparar Versiones
                      </Button>
                      <Separator />
                      <Button variant="ghost" className="justify-start p-2">
                        <BookCopy className="mr-2 h-4 w-4" /> Ver Concordancia
                      </Button>
                      <Separator />
                      <Button variant="ghost" className="justify-start p-2">
                        <Droplet className="mr-2 h-4 w-4" /> Resaltar
                      </Button>
                       <Separator />
                      <Button variant="ghost" className="justify-start p-2">
                        <Share2 className="mr-2 h-4 w-4" /> Compartir
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </p>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <h3 className="text-2xl font-headline">Seleccione un libro y capítulo</h3>
            <p className="mt-2">El contenido del capítulo aparecerá aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
