
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

  const [openMenuIndex, setOpenMenuIndex] = React.useState<number | null>(null);
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = React.useRef(false);
  const [selectedVerseNumbers, setSelectedVerseNumbers] = React.useState<Set<number>>(new Set());


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

  // Reset verse selection when chapter changes
  React.useEffect(() => {
    setSelectedVerseNumbers(new Set());
  }, [book, chapter, version]);


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


  const copyToClipboard = () => {
    if (selectedVerseNumbers.size === 0) return;

    const versesToCopy = Array.from(selectedVerseNumbers).sort((a,b) => a - b).map(verseNumber => {
      const verseData = content.find(v => v.type === 'verse' && v.number === verseNumber);
      return verseData ? `${book.name} ${chapter}:${verseData.number} - ${verseData.text}` : '';
    }).filter(Boolean);

    const textToCopy = versesToCopy.join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copiado",
      description: `${selectedVerseNumbers.size} versículo(s) copiado(s) al portapapeles.`,
    });
    setSelectedVerseNumbers(new Set()); // Clear selection
  }
  
  const handleShare = async () => {
    if (selectedVerseNumbers.size === 0) return;
    
    const versesToShare = Array.from(selectedVerseNumbers).sort((a, b) => a - b).map(verseNumber => {
        const verseData = content.find(v => v.type === 'verse' && v.number === verseNumber);
        return verseData ? verseData.text : '';
    }).filter(Boolean);

    const firstVerse = Math.min(...Array.from(selectedVerseNumbers));
    const lastVerse = Math.max(...Array.from(selectedVerseNumbers));
    const verseRange = firstVerse === lastVerse ? firstVerse : `${firstVerse}-${lastVerse}`;
    
    const shareText = `${book.name} ${chapter}:${verseRange} (${version})\n\n"${versesToShare.join(' ')}"`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${book.name} ${chapter}:${verseRange}`,
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
        const textToCopy = Array.from(selectedVerseNumbers).sort((a,b) => a - b).map(verseNumber => {
            const verseData = content.find(v => v.type === 'verse' && v.number === verseNumber);
            return verseData ? `${book.name} ${chapter}:${verseData.number} - ${verseData.text}` : '';
        }).filter(Boolean).join('\n\n');

        navigator.clipboard.writeText(textToCopy);
        toast({
            title: "Copiado al portapapeles",
            description: "La función de compartir no está disponible en tu navegador. El/los versículo(s) han sido copiados.",
        });
    }
    setSelectedVerseNumbers(new Set()); // Clear selection
  };

  const handleAction = (verseData: VerseData, action: (verse: SelectedVerse) => void) => {
    if(verseData.type !== 'verse') return;
    action({ book: book.name, chapter, verse: verseData.number, text: verseData.text, version });
  }

  const handleHighlightClick = (color: string | null) => {
    if (selectedVerseNumbers.size === 0) return;

    const versesToHighlight = Array.from(selectedVerseNumbers).map(verseNumber => {
        return content.find(v => v.type === 'verse' && v.number === verseNumber);
    }).filter((v): v is VerseData => !!v);

    versesToHighlight.forEach(verseData => {
        const verseInfo = { book: book.name, chapter, verse: verseData.number, text: verseData.text, version };
        onHighlight(verseInfo, color);
        setHighlightedVersesMap(prev => ({
            ...prev,
            [`${chapter}-${verseData.number}`]: color ? { ...verseInfo, color, id: '', createdAt: new Date() } : undefined
        }));
    });
    setSelectedVerseNumbers(new Set()); // Clear selection after highlighting
  }

  const onVerseTouchStart = (index: number) => {
    isScrollingRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
        if (!isScrollingRef.current) {
            setOpenMenuIndex(index);
        }
        longPressTimeoutRef.current = null;
    }, 500);
  };

  const onVerseTouchMove = () => {
    isScrollingRef.current = true;
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
    }
  };

  const onVerseTouchEnd = (verseNumber: number) => {
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
        // This was a tap, not a long press
        setSelectedVerseNumbers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(verseNumber)) {
                newSet.delete(verseNumber);
            } else {
                newSet.add(verseNumber);
            }
            return newSet;
        });
    }
  };

  const handleMenuOpen = (index: number, open: boolean) => {
    if (isScrollingRef.current && open) {
      return;
    }
    setOpenMenuIndex(open ? index : null);
  };

  const handleVerseClick = (verseNumber: number) => {
    // For desktop clicks
     setSelectedVerseNumbers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(verseNumber)) {
            newSet.delete(verseNumber);
        } else {
            newSet.add(verseNumber);
        }
        return newSet;
    });
  }
  
  const renderVerse = (verseData: VerseData, index: number) => {
    const key = `${verseData.type}-${verseData.number}-${index}`;
    if (verseData.type === 'title') {
      return <h3 key={key} className="text-xl font-bold font-headline mt-6 mb-2 text-primary">{verseData.text}</h3>;
    }
    
    const highlight = highlightedVersesMap[`${chapter}-${verseData.number}`];
    const highlightClass = highlight ? HIGHLIGHT_COLORS.find(c => c.color === highlight.color)?.className : '';
    const isSelected = selectedVerseNumbers.has(verseData.number);

    return (
       <p key={key} className={cn("leading-relaxed", highlightClass)} id={`verse-${chapter}-${verseData.number}`}>
        <DropdownMenu open={openMenuIndex === index} onOpenChange={(open) => handleMenuOpen(index, open)}>
          <DropdownMenuTrigger asChild>
            <span 
              className={cn("cursor-pointer hover:bg-secondary/80 rounded-md p-1 transition-colors", {
                'underline decoration-primary decoration-2 underline-offset-4': isSelected
              })}
              onTouchStart={() => onVerseTouchStart(index)}
              onTouchMove={onVerseTouchMove}
              onTouchEnd={() => onVerseTouchEnd(verseData.number)}
              onClick={() => handleVerseClick(verseData.number)}
              onContextMenu={(e) => {
                e.preventDefault();
                // Ensure verse is selected on right click before opening menu
                if (!selectedVerseNumbers.has(verseData.number)) {
                    setSelectedVerseNumbers(prev => new Set(prev).add(verseData.number));
                }
                handleMenuOpen(index, true);
              }}
            >
              <strong className="font-bold pr-2 text-primary">{verseData.number}</strong>
              {verseData.text}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={copyToClipboard} disabled={selectedVerseNumbers.size === 0}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar {selectedVerseNumbers.size > 0 ? `(${selectedVerseNumbers.size})` : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(verseData, onCompareVerse)} disabled={selectedVerseNumbers.size !== 1}>
                    <BookOpen className="mr-2 h-4 w-4" /> Comparar Versiones
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(verseData, onConcordance)} disabled={selectedVerseNumbers.size !== 1}>
                    <BookCopy className="mr-2 h-4 w-4" /> Ver Concordancia
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={selectedVerseNumbers.size === 0}>
                        <Heart className="mr-2 h-4 w-4" /> Resaltar {selectedVerseNumbers.size > 0 ? `(${selectedVerseNumbers.size})` : ''}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {HIGHLIGHT_COLORS.map(c => (
                                <DropdownMenuItem key={c.color} onClick={() => handleHighlightClick(c.color)}>
                                    <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: c.color }} />
                                    {c.name}
                                </DropdownMenuItem>
                            ))}
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleHighlightClick(null)}>
                                Quitar resaltado
                             </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShare} disabled={selectedVerseNumbers.size === 0}>
                    <Share2 className="mr-2 h-4 w-4" /> Compartir {selectedVerseNumbers.size > 0 ? `(${selectedVerseNumbers.size})` : ''}
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
             className="font-headline text-3xl md:text-4xl flex items-center gap-2"
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
