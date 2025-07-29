
"use client"

import * as React from 'react'
import type { Book } from '@/lib/bible-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BookSelectorProps {
  oldTestamentBooks: Book[];
  newTestamentBooks: Book[];
  selectedBook: Book | null;
  onBookSelect: (book: Book) => void;
}

function BookList({ books, selectedBook, onBookSelect }: { books: Book[], selectedBook: Book | null, onBookSelect: (book: Book) => void }) {
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset scroll position on tab change
    if (value === 'antiguo' && atScrollRef.current) {
      atScrollRef.current.scrollTop = 0;
    }
    if (value === 'nuevo' && ntScrollRef.current) {
      ntScrollRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="space-y-6 lg:flex lg:flex-col lg:h-[calc(100vh-5rem)]">
      <Card className="card-material flex-shrink-0">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Seleccionar Testamento</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="antiguo" className="font-headline">Antiguo</TabsTrigger>
              <TabsTrigger value="nuevo" className="font-headline">Nuevo</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className="card-material flex-grow flex flex-col overflow-hidden">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Seleccionar Libro</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto p-4 pt-0">
            <div className="h-full">
              {activeTab === 'antiguo' ? (
                 <ScrollArea className="h-full" viewportRef={atScrollRef}>
                    <BookList books={oldTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
                 </ScrollArea>
              ): (
                <ScrollArea className="h-full" viewportRef={ntScrollRef}>
                    <BookList books={newTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
                </ScrollArea>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
