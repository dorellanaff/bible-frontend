
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
}

export function VerseComparisonDialog({ isOpen, onOpenChange, verseInfo, versions, books }: VerseComparisonDialogProps) {
  const { book, chapter, verse, text, version: currentVersion } = verseInfo;
  const [comparisons, setComparisons] = useState<VerseComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllVersions() {
      if (!isOpen) return;
      setIsLoading(true);

      const bookObject = books.find(b => b.name === book);
      if (!bookObject) {
          setIsLoading(false);
          setComparisons([]);
          return;
      }
      
      const fetchPromises = versions.map(async (version) => {
        try {
          if (version.abbreviation === currentVersion) {
            return { version: version.abbreviation, text: text };
          }

          // First, try to get from local DB
          const localData = await getChapterFromDb(version.abbreviation, bookObject, chapter);
          if (localData) {
            const verseData = localData.find(v => v.number === verse && v.type === 'verse');
            return { version: version.abbreviation, text: verseData?.text || "No encontrado en BD." };
          }
          
          // If not in DB, fetch from API
          const bookName = bookObject.name.toLowerCase().replace(/ /g, '');
          const apiVersion = version.abbreviation === 'RVR1960' ? 'RV1960' : version.abbreviation;
          const response = await fetch(`${API_BASE_URL}/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
          
          if (!response.ok) {
            console.warn(`API request failed for ${version.abbreviation}: ${response.statusText}`);
            return { version: version.abbreviation, text: null };
          }
          
          const data = await response.json();
          const verseDataFromApi = data.chapter?.[0]?.data.find((v: any) => v.number === verse && v.type === 'verse');
          return { version: version.abbreviation, text: verseDataFromApi?.text || "No encontrado en API." };
        } catch (e) {
          console.error(`Error fetching verse for ${version.abbreviation}:`, e);
          return { version: version.abbreviation, text: null };
        }
      });
      
      const results = await Promise.all(fetchPromises);
      setComparisons(results);
      setIsLoading(false);
    }
    
    fetchAllVersions();
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
            <div className="grid gap-4 py-4">
            {isLoading ? (
                versions.map(version => (
                    <div key={version.abbreviation} className="p-4 rounded-lg bg-secondary/50 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))
            ) : (
                comparisons.map(item => (
                    <div key={item.version} className="p-4 rounded-lg bg-secondary/50">
                        <h4 className="font-bold text-lg font-headline text-primary">{item.version}</h4>
                        <p className="mt-1 text-readable">{item.text || "Versículo no disponible en esta versión."}</p>
                    </div>
                ))
            )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
