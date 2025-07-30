
"use client"

import * as React from 'react'
import { BookOpen, Copy, Share2, BookCopy, Heart } from 'lucide-react'
import type { Book, VerseData } from '@/lib/bible-data'
import { HighlightedVerse } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from '@/components/ui/skeleton'
import { cn, toTitleCase } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';


type SelectedVerse = { book: string; chapter: number; verse: number; text: string; version: string; references?: { source: string; target: string }[] };

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
  isMobile: boolean;
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
    isMobile,
}, ref) => {
  const { toast } = useToast()
  
  const [animationClass, setAnimationClass] = React.useState('');
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [highlightedVersesMap, setHighlightedVersesMap] = React.useState<Record<string, HighlightedVerse | undefined>>({});

  const [openMenuVerse, setOpenMenuVerse] = React.useState<number | null>(null);
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [selectedVerseNumbers, setSelectedVerseNumbers] = React.useState<Set<number>>(new Set());

  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const touchEndPos = React.useRef<{ x: number; y: number } | null>(null);
  const isScrolling = React.useRef(false);
  const MIN_SWIPE_DISTANCE = 50;
  
  const referenceLetterMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    if (!content) return map;

    let refCounter = 0;
    content.forEach(verseData => {
        if (verseData.type === 'verse' && verseData.references && verseData.references.length > 0) {
            map[verseData.number] = String.fromCharCode(97 + refCounter); // 97 is 'a'
            refCounter++;
        }
    });
    return map;
  }, [content]);


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
    touchEndPos.current = null;
    touchStartPos.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    isScrolling.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const currentY = e.targetTouches[0].clientY;
    
    // Check if user is scrolling vertically
    if (Math.abs(currentY - touchStartPos.current.y) > 10) {
      isScrolling.current = true;
    }
    
    touchEndPos.current = { x: e.targetTouches[0].clientX, y: currentY };
  };

  const handleTouchEnd = () => {
    if (!touchStartPos.current || !touchEndPos.current) return;

    const xDist = touchStartPos.current.x - touchEndPos.current.x;
    const yDist = touchStartPos.current.y - touchEndPos.current.y;

    if (Math.abs(xDist) > Math.abs(yDist) && Math.abs(xDist) > MIN_SWIPE_DISTANCE) {
      if (xDist > 0) { // Swipe Left
        if (chapter < book.chapters) {
          setAnimationClass('animate-turn-page-out');
          setTimeout(() => onNextChapter(), 500);
        }
      } else { // Swipe Right
        if (chapter > 1) {
          setAnimationClass('animate-turn-page-out-reverse');
          setTimeout(() => onPreviousChapter(), 500);
        }
      }
    }

    touchStartPos.current = null;
    touchEndPos.current = null;
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
      return verseData ? `${toTitleCase(book.name)} ${chapter}:${verseData.number} - ${verseData.text}` : '';
    }).filter(Boolean);

    const textToCopy = versesToCopy.join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copiado",
      description: `${selectedVerseNumbers.size} versículo(s) copiado(s) al portapapeles.`,
    });
    setSelectedVerseNumbers(new Set()); // Clear selection
    setOpenMenuVerse(null);
  }
  
  const handleShare = async () => {
    if (selectedVerseNumbers.size === 0) return;

    const sortedVerses = Array.from(selectedVerseNumbers).sort((a, b) => a - b);
    
    const versesToShare = sortedVerses.map(verseNumber => {
        const verseData = content.find(v => v.type === 'verse' && v.number === verseNumber);
        return verseData ? verseData.text : '';
    }).filter(Boolean);

    const firstVerse = sortedVerses[0];
    const lastVerse = sortedVerses[sortedVerses.length - 1];
    
    const isContiguous = sortedVerses.length > 1 && lastVerse - firstVerse === sortedVerses.length - 1;

    let verseRange = '';
    if (sortedVerses.length === 1) {
        verseRange = `${firstVerse}`;
    } else if (isContiguous) {
        verseRange = `${firstVerse}-${lastVerse}`;
    } else {
        verseRange = sortedVerses.join(', ');
    }
    
    const shareText = `${toTitleCase(book.name)} ${chapter}:${verseRange} (${version})\n\n"${versesToShare.join(' ')}"`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${toTitleCase(book.name)} ${chapter}:${verseRange}`,
          text: shareText,
        });
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
            console.error('Error al compartir:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo compartir el/los versículo(s).",
            });
        }
      }
    } else {
        navigator.clipboard.writeText(shareText);
        toast({
            title: "Copiado al portapapeles",
            description: "La función de compartir no está disponible en tu navegador. El contenido ha sido copiado.",
        });
    }
    setSelectedVerseNumbers(new Set()); // Clear selection
    setOpenMenuVerse(null);
  };


  const handleSingleVerseAction = (verseNumber: number, action: (verse: SelectedVerse) => void) => {
    const verseData = content.find(v => v.type === 'verse' && v.number === verseNumber);
    if (!verseData) return;
    action({ book: book.name, chapter, verse: verseData.number, text: verseData.text, version, references: verseData.references });
    setOpenMenuVerse(null);
  }

  const handleHighlightClick = (color: string | null) => {
    if (selectedVerseNumbers.size === 0) return;

    const versesToHighlight = Array.from(selectedVerseNumbers).map(verseNumber => {
        return content.find(v => v.type === 'verse' && v.number === verseNumber);
    }).filter((v): v is VerseData & { type: 'verse' } => !!v && v.type === 'verse');

    versesToHighlight.forEach(verseData => {
        const verseInfo = { book: book.name, chapter, verse: verseData.number, text: verseData.text, version, references: verseData.references };
        onHighlight(verseInfo, color);
        setHighlightedVersesMap(prev => ({
            ...prev,
            [`${chapter}-${verseData.number}`]: color ? { ...verseInfo, color, id: '', createdAt: new Date() } : undefined
        }));
    });
    setSelectedVerseNumbers(new Set()); // Clear selection after highlighting
    setOpenMenuVerse(null);
  }

  const onVerseTouchStart = (e: React.TouchEvent, verseNumber: number) => {
    // Reset scrolling check on new touch
    isScrolling.current = false;
    touchStartPos.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    
    longPressTimeoutRef.current = setTimeout(() => {
        // Only trigger long press if not scrolling
        if (!isScrolling.current && longPressTimeoutRef.current) {
            setSelectedVerseNumbers(prev => new Set(prev).add(verseNumber));
            setOpenMenuVerse(verseNumber);
        }
        longPressTimeoutRef.current = null;
    }, 700);
  };

  const onVerseTouchMove = (e: React.TouchEvent) => {
    if (touchStartPos.current) {
      const deltaY = Math.abs(e.targetTouches[0].clientY - touchStartPos.current.y);
      if (deltaY > 10) { // If moved more than 10px vertically, consider it scrolling
        isScrolling.current = true;
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
      }
    }
  };

  const onVerseTouchEnd = (verseNumber: number) => {
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
        if (!isScrolling.current) {
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
    }
     // Reset touch start position
    touchStartPos.current = null;
  };

  const handleMenuOpen = (verseNumber: number, open: boolean) => {
    if (!open) {
      setOpenMenuVerse(null);
    }
  };
  
  const renderVerse = (verseData: VerseData, index: number) => {
    if (verseData.type !== 'verse') {
      const key = `${verseData.type}-${index}`;
      return <h3 key={key} className="text-xl font-bold font-headline mt-6 mb-2 text-primary">{verseData.text}</h3>;
    }
    
    const key = `${verseData.type}-${verseData.number}-${index}`;
    const highlight = highlightedVersesMap[`${chapter}-${verseData.number}`];
    const highlightClass = highlight ? HIGHLIGHT_COLORS.find(c => c.color === highlight.color)?.className : '';
    const isSelected = selectedVerseNumbers.has(verseData.number);
    const hasReferences = verseData.references && verseData.references.length > 0;
    const referenceLetter = referenceLetterMap[verseData.number];

    return (
       <p key={key} className={cn("leading-relaxed", highlightClass)} id={`verse-${chapter}-${verseData.number}`}>
        <DropdownMenu open={openMenuVerse === verseData.number} onOpenChange={(open) => handleMenuOpen(verseData.number, open)}>
          <DropdownMenuTrigger asChild>
            <span 
              className={cn("cursor-pointer hover:bg-secondary/80 rounded-md p-1 transition-colors", {
                'underline decoration-primary decoration-2 underline-offset-4': isSelected,
              }, isMobile && 'select-none')}
              onTouchStart={(e) => onVerseTouchStart(e, verseData.number)}
              onTouchMove={onVerseTouchMove}
              onTouchEnd={() => onVerseTouchEnd(verseData.number)}
              onClick={() => {
                 if (!isMobile) { // For desktop clicks
                    setSelectedVerseNumbers(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(verseData.number)) newSet.delete(verseData.number);
                        else newSet.add(verseData.number);
                        return newSet;
                    });
                 }
              }}
              onContextMenu={(e) => { // Desktop right-click
                e.preventDefault();
                setSelectedVerseNumbers(prev => new Set(prev).add(verseData.number));
                setOpenMenuVerse(verseData.number);
              }}
            >
              <strong className="font-bold pr-2 text-primary">{verseData.number}</strong>
              {verseData.text}
              {hasReferences && <sup className="font-serif text-primary pl-1">({referenceLetter})</sup>}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={copyToClipboard} disabled={selectedVerseNumbers.size === 0} className="text-base py-3">
                    <Copy className="mr-2 h-4 w-4" /> Copiar {selectedVerseNumbers.size > 1 ? `(${selectedVerseNumbers.size})` : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSingleVerseAction(verseData.number, onCompareVerse)} disabled={selectedVerseNumbers.size !== 1} className="text-base py-3">
                    <BookOpen className="mr-2 h-4 w-4" /> Comparar Versiones
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSingleVerseAction(verseData.number, onConcordance)} disabled={selectedVerseNumbers.size !== 1 || !hasReferences} className="text-base py-3">
                    <BookCopy className="mr-2 h-4 w-4" /> Ver Concordancia
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={selectedVerseNumbers.size === 0} className="text-base py-3">
                        <Heart className="mr-2 h-4 w-4" /> Resaltar {selectedVerseNumbers.size > 1 ? `(${selectedVerseNumbers.size})` : ''}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent sideOffset={8} align="center">
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
                <DropdownMenuItem onClick={handleShare} disabled={selectedVerseNumbers.size === 0} className="text-base py-3">
                    <Share2 className="mr-2 h-4 w-4" /> Compartir {selectedVerseNumbers.size > 1 ? `(${selectedVerseNumbers.size})` : ''}
                </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </p>
    )
  }

  return (
    <Card 
      className={cn(
        "card-material overflow-hidden [perspective:1000px]",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={contentRef} className={cn("w-full h-full [transform-style:preserve-3d]", animationClass)}>
        <CardHeader>
          <CardTitle 
             className="font-headline text-3xl md:text-4xl flex items-center gap-2"
          >
            <span>{toTitleCase(book.name)}</span>
             <span className="font-headline font-bold text-3xl md:text-4xl p-1 h-auto flex items-center gap-1">
                {chapter}
            </span>
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
