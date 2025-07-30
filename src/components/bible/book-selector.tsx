
"use client"

import * as React from 'react'
import type { Book } from '@/lib/bible-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BookSelectorProps {
  oldTestamentBooks: Book[];
  newTestamentBooks: Book[];
  selectedBook: Book | null;
  onBookSelect: (book: Book | null) => void;
}

function BookList({ books, selectedBook, onBookSelect, bookRefs }: { books: Book[], selectedBook: Book | null, onBookSelect: (book: Book | null) => void, bookRefs: React.MutableRefObject<(HTMLButtonElement | null)[]> }) {
  return (
    <div className="flex flex-col space-y-2 p-1">
      {books.map((book, index) => (
        <Button
          key={book.name}
          ref={el => bookRefs.current[index] = el}
          variant={selectedBook?.name === book.name ? 'default' : 'secondary'}
          onClick={() => onBookSelect(book)}
          className="font-headline justify-start text-base py-3 h-auto"
        >
          {book.name}
        </Button>
      ))}
    </div>
  )
}

export function BookSelector({ oldTestamentBooks, newTestamentBooks, selectedBook, onBookSelect }: BookSelectorProps) {
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
                <TabsTrigger value="antiguo" className="font-headline">Antiguo</TabsTrigger>
                <TabsTrigger value="nuevo" className="font-headline">Nuevo</TabsTrigger>
                </TabsList>
                <div 
                    className="flex-grow h-full overflow-y-auto mt-4"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <TabsContent value="antiguo">
                        <ScrollArea className="h-[calc(100vh-18rem)] p-4" viewportRef={atScrollRef}>
                            <BookList books={oldTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} bookRefs={atBookRefs} />
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="nuevo">
                        <ScrollArea className="h-[calc(100vh-18rem)] p-4" viewportRef={ntScrollRef}>
                            <BookList books={newTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} bookRefs={ntBookRefs} />
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
