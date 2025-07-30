
"use client"

import * as React from 'react'
import type { Book } from '@/lib/bible-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart } from 'lucide-react'
import { toTitleCase } from '@/lib/utils'

interface BookSelectorProps {
  oldTestamentBooks: Book[];
  newTestamentBooks: Book[];
  selectedBook: Book | null;
  onBookSelect: (book: Book | null) => void;
  highlightCounts: Record<string, number>;
  onShowHighlights: (book: Book) => void;
}

function BookList({ 
  books, 
  selectedBook, 
  onBookSelect, 
  bookRefs, 
  highlightCounts,
  onShowHighlights
}: { 
  books: Book[], 
  selectedBook: Book | null, 
  onBookSelect: (book: Book | null) => void, 
  bookRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
  highlightCounts: Record<string, number>,
  onShowHighlights: (book: Book) => void
}) {
  return (
    <div className="flex flex-col space-y-2 p-1">
      {books.map((book, index) => {
        const count = highlightCounts[book.name] || 0;
        return (
          <div key={book.name} className="flex items-center gap-1">
            <Button
              ref={el => bookRefs.current[index] = el}
              variant={selectedBook?.name === book.name ? 'default' : 'secondary'}
              onClick={() => onBookSelect(book)}
              className="font-headline justify-start text-base py-3 h-auto flex-grow"
            >
              {toTitleCase(book.name)}
            </Button>
            {count > 0 && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowHighlights(book);
                  }}
                >
                  <div className="relative">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {count}
                    </span>
                  </div>
                </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function BookSelector({ oldTestamentBooks, newTestamentBooks, selectedBook, onBookSelect, highlightCounts, onShowHighlights }: BookSelectorProps) {
  const [activeTab, setActiveTab] = React.useState('antiguo');
  const atScrollRef = React.useRef<HTMLDivElement>(null);
  const ntScrollRef = React.useRef<HTMLDivElement>(null);

  const atBookRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  atBookRefs.current = oldTestamentBooks.map((_, i) => atBookRefs.current[i] ?? React.createRef<HTMLButtonElement>() as any);
  
  const ntBookRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  ntBookRefs.current = newTestamentBooks.map((_, i) => ntBookRefs.current[i] ?? React.createRef<HTMLButtonElement>() as any);


  const [touchStart, setTouchStart] = React.useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 50;
  
  React.useEffect(() => {
    if (selectedBook) {
      const isNT = newTestamentBooks.some(b => b.name === selectedBook.name);
      if (isNT) {
        setActiveTab('nuevo');
      } else {
        setActiveTab('antiguo');
      }
    }
  }, [selectedBook, newTestamentBooks]);

  React.useEffect(() => {
    if (selectedBook) {
      const isAT = oldTestamentBooks.some(b => b.name === selectedBook.name);
      const isNT = newTestamentBooks.some(b => b.name === selectedBook.name);

      const scrollToBook = () => {
        if (isAT && activeTab === 'antiguo') {
            const bookIndex = oldTestamentBooks.findIndex(b => b.name === selectedBook.name);
            const bookElement = atBookRefs.current[bookIndex];
            bookElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (isNT && activeTab === 'nuevo') {
            const bookIndex = newTestamentBooks.findIndex(b => b.name === selectedBook.name);
            const bookElement = ntBookRefs.current[bookIndex];
            bookElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      // Delay scrolling to allow tab content to render
      setTimeout(scrollToBook, 100);
    }
  }, [selectedBook, activeTab, oldTestamentBooks, newTestamentBooks]);


  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
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
      // Swipe Left -> New Testament
      if (activeTab === 'antiguo') {
        handleTabChange('nuevo');
      }
    } else {
      // Swipe Right -> Old Testament
      if (activeTab === 'nuevo') {
        handleTabChange('antiguo');
      }
    }
  };


  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background">
        <Card className="card-material flex-shrink-0">
            <CardContent className="p-2">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="antiguo" className="font-headline text-base">Antiguo</TabsTrigger>
                <TabsTrigger value="nuevo" className="font-headline text-base">Nuevo</TabsTrigger>
                </TabsList>
            </Tabs>
            </CardContent>
        </Card>
      </div>
       <div 
          className="flex-grow overflow-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="antiguo" className="h-full mt-0">
            <ScrollArea className="h-full p-4" viewportRef={atScrollRef}>
              <BookList 
                books={oldTestamentBooks} 
                selectedBook={selectedBook} 
                onBookSelect={onBookSelect} 
                bookRefs={atBookRefs}
                highlightCounts={highlightCounts}
                onShowHighlights={onShowHighlights}
              />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="nuevo" className="h-full mt-0">
            <ScrollArea className="h-full p-4" viewportRef={ntScrollRef}>
              <BookList 
                books={newTestamentBooks} 
                selectedBook={selectedBook} 
                onBookSelect={onBookSelect} 
                bookRefs={ntBookRefs}
                highlightCounts={highlightCounts}
                onShowHighlights={onShowHighlights}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
