
"use client"

import * as React from 'react'
import { BookOpen, Copy, Share2, BookCopy, Heart, Check } from 'lucide-react'
import type { Book, VerseData } from '@/lib/bible-data'
import { HighlightedVerse } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';


type SelectedVerse = { book: string; chapter: number; verse: number; text: string; version: string };

interface ChapterViewerProps {
  book: Book;
  chapter: number;
  version: string;
  content: VerseData[];
  isLoading: boolean;
  onCompareVerse: (verse: SelectedVerse) => void;
  onConcordance: (verse: SelectedVerse) => void;
  onHighlight: (verse: SelectedVerse, color: string | null) => void;
  getHighlightForVerse: (version: string, book: string, chapter: number, verse: number) => Promise<HighlightedVerse | undefined>;
  onNextChapter: () => void;
  onPreviousChapter: () => void;
  onChapterSelect: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Amarillo', color: '#fef08a', className: 'bg-yellow-200/70' },
  { name: 'Verde', color: '#bbf7d0', className: 'bg-green-200/70' },
  { name: 'Azul', color: '#bfdbfe', className: 'bg-blue-200/70' },
  { name: 'Rosa', color: '#fbcfe8', className: 'bg-pink-200/70' },
  { name: 'Morado', color: '#e9d5ff', className: 'bg-purple-200/70' },
];

export const ChapterViewer = React.forwardRef<HTMLDivElement, ChapterViewerProps>(({ 
    book, 
    chapter, 
    version, 
    content, 
    isLoading, 
    onCompareVerse, 
    onConcordance,
    onHighlight,
    getHighlightForVerse, 
    onNextChapter, 
    onPreviousChapter, 
    onChapterSelect 
}, ref) => {
  const { toast } = useToast()
  const [touchStart, setTouchStart] = React.useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 50;
  
  const [animationClass, setAnimationClass] = React.useState('');
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [highlightedVersesMap, setHighlightedVersesMap] = React.useState<Record<string, HighlightedVerse | undefined>>({});

  React.useEffect(() => {
    const fetchHighlights = async () => {
        if (!content || content.length === 0) return;
        const newMap: Record<string, HighlightedVerse | undefined> = {};
        for (const verseData of content) {
            if(verseData.type !== 'verse') continue;
            const highlight = await getHighlightForVerse(version, book.name, chapter, verseData.number);
            newMap[`${chapter}-${verseData.number}`] = highlight;
        }
        setHighlightedVersesMap(newMap);
    };
    fetchHighlights();
  }, [content, version, book.name, chapter, getHighlightForVerse]);


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
    }, 500);

    return () => clearTimeout(timer);
  }, [chapter, content, animationClass]);


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Versículo copiado al portapapeles.",
    })
  }
  
  const handleShare = async (verseData: VerseData) => {
    if (verseData.type !== 'verse') return;

    const shareText = `${book.name} ${chapter}:${verseData.number} (${version})\n\n"${verseData.text}"`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${book.name} ${chapter}:${verseData.number}`,
          text: shareText,
        });
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
            console.error('Error al compartir:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo compartir el versículo.",
            });
        }
      }
    } else {
      copyToClipboard(shareText)
      toast({
        title: "Copiado al portapapeles",
        description: "La función de compartir no está disponible en tu navegador. El versículo ha sido copiado.",
      });
    }
  };

  const handleAction = (verseData: VerseData, action: (verse: SelectedVerse) => void) => {
    if(verseData.type !== 'verse') return;
    action({ book: book.name, chapter, verse: verseData.number, text: verseData.text, version });
  }

  const handleHighlightClick = (verseData: VerseData, color: string | null) => {
    if (verseData.type !== 'verse') return;
    const verseInfo = { book: book.name, chapter, verse: verseData.number, text: verseData.text, version };
    onHighlight(verseInfo, color);
    setHighlightedVersesMap(prev => ({
        ...prev,
        [`${chapter}-${verseData.number}`]: color ? { ...verseInfo, color, id: '', createdAt: new Date() } : undefined
    }));
  }
  
  const renderVerse = (verseData: VerseData, index: number) => {
    const key = `${verseData.type}-${verseData.number}-${index}`;
    if (verseData.type === 'title') {
      return <h3 key={key} className="text-xl font-bold font-headline mt-6 mb-2 text-primary">{verseData.text}</h3>;
    }
    
    const highlight = highlightedVersesMap[`${chapter}-${verseData.number}`];
    const highlightClass = highlight ? HIGHLIGHT_COLORS.find(c => c.color === highlight.color)?.className : '';

    return (
       <p key={key} className={cn("leading-relaxed inline", highlightClass)} id={`verse-${chapter}-${verseData.number}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="cursor-pointer hover:bg-secondary/80 rounded-md p-1 transition-colors">
              <strong className="font-bold pr-2 text-primary">{verseData.number}</strong>
              {verseData.text}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => copyToClipboard(`${book.name} ${chapter}:${verseData.number} - ${verseData.text} (${version})`)}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(verseData, onCompareVerse)}>
                    <BookOpen className="mr-2 h-4 w-4" /> Comparar Versiones
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(verseData, onConcordance)}>
                    <BookCopy className="mr-2 h-4 w-4" /> Ver Concordancia
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Heart className="mr-2 h-4 w-4" /> Resaltar
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {HIGHLIGHT_COLORS.map(c => (
                                <DropdownMenuItem key={c.color} onClick={() => handleHighlightClick(verseData, highlight?.color === c.color ? null : c.color)}>
                                    <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: c.color }} />
                                    {c.name}
                                    {highlight?.color === c.color && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            ))}
                             {highlight && (
                                <>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={() => handleHighlightClick(verseData, null)}>
                                    Quitar resaltado
                                 </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShare(verseData)}>
                    <Share2 className="mr-2 h-4 w-4" /> Compartir
                </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
  );
});

ChapterViewer.displayName = 'ChapterViewer';

    