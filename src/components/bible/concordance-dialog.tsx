
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { toTitleCase } from "@/lib/utils";
import { getChapterFromDb, saveChapterToDb } from "@/lib/db";
import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { getBibleBooks, Book, VerseData } from "@/lib/bible-data";

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
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    async function loadBooks() {
      const bibleBooks = await getBibleBooks();
      setBooks(bibleBooks);
    }
    loadBooks();
  }, []);

  const getBookByName = (name: string): Book | undefined => {
    const normalizedName = name.toUpperCase().replace(/\s+/g, '');
    const cleanName = normalizedName.replace(/^(1RA|2DA|3RA)/, (match) => {
        return match.slice(0, -2);
    });
    return books.find(b => b.name.toUpperCase().replace(/\s+/g, '').includes(cleanName));
  }
  
  const fetchChapterData = async (version: string, book: Book, chapter: number): Promise<VerseData[] | null> => {
      let chapterData = await getChapterFromDb(version, book, chapter);
      if (chapterData && Array.isArray(chapterData)) {
          return chapterData;
      }
      try {
          const bookName = book.name.toLowerCase().replace(/ /g, '');
          const apiVersion = version;
          const response = await fetch(`${API_BASE_URL}/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
          
          if (response.ok) {
              const data = await response.json();
              const verses = data.chapter?.[0]?.data;
              if (Array.isArray(verses)) {
                await saveChapterToDb(version, book, chapter, verses);
                return verses;
              }
          }
      } catch (e) {
          console.error(`Failed to fetch chapter for concordance: ${version} ${book.name} ${chapter}`, e);
      }
      return null;
  }

  useEffect(() => {
    if (!isOpen || books.length === 0) {
        setConcordanceItems([]);
        return;
    };
    
    if (references.length > 0) {
        setConcordanceItems(references.map(ref => ({ target: ref.target, text: null, loading: true })));

        references.forEach(async (ref, index) => {
            try {
                const [rawBookName, chapterAndVerse] = ref.target.split(/ (.+)/);
                
                const refBook = getBookByName(rawBookName);
                
                if (!refBook || !chapterAndVerse) {
                    throw new Error("Referencia no válida.");
                }
                
                const [refChapterStr, refVerseStr] = chapterAndVerse.split(':');
                const refChapter = parseInt(refChapterStr, 10);
                const refVerse = parseInt(refVerseStr, 10);
                
                if (isNaN(refChapter) || isNaN(refVerse)) {
                    throw new Error("Referencia mal formateada.");
                }

                const chapterData = await fetchChapterData(currentVersion, refBook, refChapter);

                if (Array.isArray(chapterData)) {
                    const verseData = chapterData.find(v => v.type === 'verse' && v.number === refVerse);
                    setConcordanceItems(prev => {
                        const newItems = [...prev];
                        newItems[index] = { ...newItems[index], text: verseData?.text || "No se encontró el versículo.", loading: false };
                        return newItems;
                    });
                } else {
                     throw new Error("No se pudo obtener el capítulo.");
                }

            } catch (error) {
                 setConcordanceItems(prev => {
                    const newItems = [...prev];
                    const errorMessage = "No se pudo cargar el texto.";
                    newItems[index] = { ...newItems[index], text: errorMessage, loading: false };
                    return newItems;
                });
            }
        });
    }
  }, [isOpen, references, currentVersion, books]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Concordancia Bíblica</DialogTitle>
          <DialogDescription>
            {toTitleCase(book)} {chapter}:{verse}
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
