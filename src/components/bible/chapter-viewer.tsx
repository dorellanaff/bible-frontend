
"use client"

import * as React from 'react'
import { BookOpen, Copy, Droplet, Share2, BookCopy } from 'lucide-react'
import type { Book, VerseData } from '@/lib/bible-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type SelectedVerse = { book: string; chapter: number; verse: number; text: string; version: string };

interface ChapterViewerProps {
  book: Book;
  chapter: number;
  version: string;
  content: VerseData[];
  isLoading: boolean;
  onCompareVerse: (verse: SelectedVerse) => void;
  onConcordance: (verse: SelectedVerse) => void;
  onNextChapter: () => void;
  onPreviousChapter: () => void;
  onChapterSelect: () => void;
}

export function ChapterViewer({ book, chapter, version, content, isLoading, onCompareVerse, onConcordance, onNextChapter, onPreviousChapter, onChapterSelect }: ChapterViewerProps) {
  const { toast } = useToast()
  const [touchStart, setTouchStart] = React.useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 50;
  
  const [animationClass, setAnimationClass] = React.useState('');
  const contentRef = React.useRef<HTMLDivElement>(null);


  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const xDist = touchStart.x - touchEnd.x;
    const yDist = touchStart.y - touchEnd.y;

    // Only consider it a swipe if the horizontal movement is greater than the vertical movement
    if (Math.abs(xDist) < Math.abs(yDist) || Math.abs(xDist) < minSwipeDistance) {
      return;
    }

    const isLeftSwipe = xDist > 0;

    if (isLeftSwipe) {
      if (chapter < book.chapters) {
        setAnimationClass('animate-turn-page-out');
        setTimeout(() => {
          onNextChapter();
        }, 500);
      }
    } else {
      if (chapter > 1) {
        setAnimationClass('animate-turn-page-out-reverse');
        setTimeout(() => {
          onPreviousChapter();
        }, 500);
      }
    }
  };

  React.useEffect(() => {
    if (animationClass.includes('turn-page-out-reverse')) {
        setAnimationClass('animate-turn-page-in-reverse');
    } else if (animationClass.includes('turn-page-out')) {
        setAnimationClass('animate-turn-page-in');
    }
    
    const timer = setTimeout(() => {
        if (animationClass.includes('turn-page-in')) {
            setAnimationClass('');
        }
    }, 500); // Corresponds to animation duration

    return () => clearTimeout(timer);
  }, [chapter, content, animationClass]);


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Versículo copiado al portapapeles.",
    })
  }

  const handleAction = (verseData: VerseData, action: (verse: SelectedVerse) => void) => {
    if(verseData.type !== 'verse') return;
    action({ book: book.name, chapter, verse: verseData.number, text: verseData.text, version });
  }
  
  const renderVerse = (verseData: VerseData, index: number) => {
    const key = `${verseData.type}-${verseData.number}-${index}`;
    if (verseData.type === 'title') {
      return <h3 key={key} className="text-xl font-bold font-headline mt-6 mb-2 text-primary">{verseData.text}</h3>;
    }

    return (
       <p key={key} className="leading-relaxed">
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer hover:bg-secondary/80 rounded-md p-1 transition-colors">
              <strong className="font-bold pr-2 text-primary">{verseData.number}</strong>
              {verseData.text}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col text-sm">
              <Button variant="ghost" className="justify-start p-2" onClick={() => copyToClipboard(`${book.name} ${chapter}:${verseData.number} - ${verseData.text} (${version})`)}>
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
              <Separator />
              <Button variant="ghost" className="justify-start p-2" onClick={() => handleAction(verseData, onCompareVerse)}>
                <BookOpen className="mr-2 h-4 w-4" /> Comparar Versiones
              </Button>
              <Separator />
              <Button variant="ghost" className="justify-start p-2" onClick={() => handleAction(verseData, onConcordance)}>
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
    )
  }

  return (
    <Card 
      className="card-material overflow-hidden [perspective:1000px]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={contentRef} className={cn("w-full h-full [transform-style:preserve-3d]", animationClass)}>
        <CardHeader>
          <CardTitle 
             className="font-headline text-3xl md:text-4xl flex items-center gap-2 cursor-pointer md:cursor-default"
             onClick={() => onChapterSelect()}
          >
            <span>{book.name}</span>
            <span>{chapter}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
              <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                  <Skeleton className="h-6 w-full" />
              </div>
          ) : content.length > 0 ? (
            <div className="space-y-2 text-readable">
              {content.map(renderVerse)}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <h3 className="text-2xl font-headline">Contenido no disponible</h3>
              <p className="mt-2">No se pudo cargar el contenido para este capítulo. Por favor, intente de nuevo.</p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
