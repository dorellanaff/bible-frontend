"use client"

import { BIBLE_VERSIONS } from '@/lib/bible-data'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import { Skeleton } from '../ui/skeleton';

interface VerseComparisonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  verseInfo: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
  };
}

interface VerseComparison {
    version: string;
    text: string | null;
}

export function VerseComparisonDialog({ isOpen, onOpenChange, verseInfo }: VerseComparisonDialogProps) {
  const { book, chapter, verse } = verseInfo;
  const [comparisons, setComparisons] = useState<VerseComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllVersions() {
      if (!isOpen) return;
      setIsLoading(true);
      
      const fetchPromises = BIBLE_VERSIONS.map(async (version) => {
        try {
          const bookName = book.toLowerCase().replace(/ /g, '');
          const apiVersion = version === 'RVR1960' ? 'RV1960' : version;
          const response = await fetch(`https://ec2-3-134-107-239.us-east-2.compute.amazonaws.com/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
          if (!response.ok) return { version, text: null };
          
          const data = await response.json();
          const verseData = data.chapter?.[0]?.data.find((v: any) => v.number === verse && v.type === 'verse');
          return { version, text: verseData?.text || null };
        } catch (e) {
          return { version, text: null };
        }
      });
      
      const results = await Promise.all(fetchPromises);
      setComparisons(results);
      setIsLoading(false);
    }
    
    fetchAllVersions();
  }, [isOpen, book, chapter, verse]);

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
                BIBLE_VERSIONS.map(version => (
                    <div key={version} className="p-4 rounded-lg bg-secondary/50 space-y-2">
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
