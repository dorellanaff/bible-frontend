
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

function BookList({ books, selectedBook, onBookSelect }: { books: Book[], selectedBook: Book | null, onBookSelect: (book: Book | null) => void }) {
  return (
    <div className="flex flex-col space-y-2 p-1">
      {books.map(book => (
        <Button
          key={book.name}
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

  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touch end
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
      // Swipe Left -> New Testament
      if (activeTab === 'antiguo') {
        handleTabChange('nuevo');
      }
    } else if (isRightSwipe) {
      // Swipe Right -> Old Testament
      if (activeTab === 'nuevo') {
        handleTabChange('antiguo');
      }
    }
  };


  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onBookSelect(null);
    setTimeout(() => {
      const scrollRef = value === 'antiguo' ? atScrollRef : ntScrollRef;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 0);
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      <Card className="card-material sticky top-0 z-10">
        <CardContent className="p-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="antiguo" className="font-headline">Antiguo</TabsTrigger>
              <TabsTrigger value="nuevo" className="font-headline">Nuevo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="antiguo" className="mt-0">
            </TabsContent>
            <TabsContent value="nuevo" className="mt-0">
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card 
        className="card-material flex-grow overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-0 h-full">
          <div className="h-full">
              {activeTab === 'antiguo' ? (
                 <ScrollArea className="h-full p-4" viewportRef={atScrollRef}>
                    <BookList books={oldTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
                 </ScrollArea>
              ): (
                <ScrollArea className="h-full p-4" viewportRef={ntScrollRef}>
                    <BookList books={newTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
                </ScrollArea>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
