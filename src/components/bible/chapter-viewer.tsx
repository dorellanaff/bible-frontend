
"use client"

import * as React from 'react'
import { BookOpen, Copy, Droplet, Share2, BookCopy, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Book, VerseData } from '@/lib/bible-data'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
}

export function ChapterViewer({ book, chapter, version, content, isLoading, onCompareVerse, onConcordance, onNextChapter, onPreviousChapter }: ChapterViewerProps) {
  const { toast } = useToast()
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);
  const minSwipeDistance = 50;
  
  const [animationClass, setAnimationClass] = React.useState('');
  const contentRef = React.useRef<HTMLDivElement>(null);


  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (chapter >= book.chapters) return;
      setAnimationClass('animate-slide-out-to-left');
      setTimeout(() => {
        onNextChapter();
      }, 200);
    } else if (isRightSwipe) {
      if (chapter <= 1) return;
      setAnimationClass('animate-slide-out-to-right');
      setTimeout(() => {
        onPreviousChapter();
      }, 200);
    }
  };

  React.useEffect(() => {
    if (animationClass.includes('slide-out')) {
      const direction = animationClass.includes('left') ? 'left' : 'right';
      setAnimationClass(`animate-slide-in-from-${direction}`);
    }
    
    const timer = setTimeout(() => {
        if (animationClass.includes('slide-in')) {
            setAnimationClass('');
        }
    }, 200);

    return () => clearTimeout(timer);
  }, [chapter, content]);


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
              <Button variant="ghost" className="justify-start p-2" onClick={() => copyToClipboard(`${book.name} ${chapter}:${verseData.number} - ${verseData.text}`)}>
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
      className="card-material overflow-hidden relative group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={contentRef} className={cn(animationClass)}>
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl">{book.name} {chapter}</CardTitle>
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

       <Button
        onClick={onPreviousChapter}
        disabled={chapter <= 1}
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">Capítulo Anterior</span>
      </Button>

      <Button
        onClick={onNextChapter}
        disabled={chapter >= book.chapters}
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-6 w-6" />
        <span className="sr-only">Capítulo Siguiente</span>
      </Button>

    </Card>
  )
}
