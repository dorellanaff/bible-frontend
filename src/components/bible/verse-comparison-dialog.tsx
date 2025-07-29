
"use client"

import { type BibleVersion, type Book } from '@/lib/bible-data'
import { getChapterFromDb } from '@/lib/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import { Skeleton } from '../ui/skeleton';
import { API_BASE_URL } from '@/lib/api';

interface VerseComparisonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  verseInfo: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    version: string;
  };
  versions: BibleVersion[];
  books: Book[];
}

interface VerseComparison {
    version: string;
    text: string | null;
    loading: boolean;
}

export function VerseComparisonDialog({ isOpen, onOpenChange, verseInfo, versions, books }: VerseComparisonDialogProps) {
  const { book, chapter, verse, text, version: currentVersion } = verseInfo;
  const [comparisons, setComparisons] = useState<VerseComparison[]>([]);
  
  useEffect(() => {
    if (!isOpen) {
        setComparisons([]); // Reset on close
        return;
    }
    
    if (versions.length === 0 || !books.length) {
        // If no versions are passed, clear comparisons
        setComparisons([]);
        return;
    };

    // Set initial loading state for all versions
    const initialComparisons = versions.map(v => ({
      version: v.abbreviation,
      text: v.abbreviation === currentVersion ? text : null,
      loading: v.abbreviation !== currentVersion,
    }));
    setComparisons(initialComparisons);
    
    const bookObject = books.find(b => b.name === book);
    if (!bookObject) {
        setComparisons(prev => prev.map(c => ({...c, loading: false})));
        return;
    }

    versions.forEach(async (version) => {
      if (version.abbreviation === currentVersion) return;

      let verseText: string | null = null;
      try {
        const localData = await getChapterFromDb(version.abbreviation, bookObject, chapter);
        if (localData) {
          const verseData = localData.find(v => v.number === verse && v.type === 'verse');
          verseText = verseData?.text || "No encontrado en BD.";
        } else {
            const bookName = bookObject.name.toLowerCase().replace(/ /g, '');
            const apiVersion = version.abbreviation === 'RVR1960' ? 'RV1960' : version.abbreviation;
            const response = await fetch(`${API_BASE_URL}/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
            
            if (response.ok) {
              const data = await response.json();
              const verses = data.chapter?.[0]?.data;
              if (verses) {
                const verseDataFromApi = verses.find((v: any) => v.number === verse && v.type === 'verse');
                verseText = verseDataFromApi?.text || "No encontrado en API.";
              } else {
                 verseText = "Estructura de API inesperada.";
              }
            } else {
                verseText = `Error de red: ${response.statusText}`;
            }
        }
      } catch (e) {
          console.error(`Error fetching verse for ${version.abbreviation}:`, e);
          verseText = "Error al obtener el versículo.";
      }

      setComparisons(prev => 
        prev.map(c => 
          c.version === version.abbreviation ? { ...c, text: verseText, loading: false } : c
        )
      );
    });
  }, [isOpen, book, chapter, verse, versions, currentVersion, text, books]);

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
            {comparisons.length > 0 ? (
                <div className="grid gap-4 py-4">
                    {comparisons.map(item => (
                        <div key={item.version} className="p-4 rounded-lg bg-secondary/50">
                            <h4 className="font-bold text-lg font-headline text-primary">{item.version}</h4>
                            {item.loading ? (
                            <div className="space-y-2 mt-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                            ) : (
                            <p className="mt-1 text-readable">{item.text || "Versículo no disponible en esta versión."}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
                    <p>Debe seleccionar 2 o más versiones para comparar.</p>
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
