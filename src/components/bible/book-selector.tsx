
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
  return (
    <Card className="card-material lg:flex lg:flex-col lg:h-[calc(100vh-5rem)]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="font-headline text-2xl">Seleccionar Libro</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0 px-4 pb-4 overflow-hidden">
        <Tabs defaultValue="antiguo" className="w-full flex-grow flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="antiguo" className="font-headline">Antiguo Testamento</TabsTrigger>
            <TabsTrigger value="nuevo" className="font-headline">Nuevo Testamento</TabsTrigger>
          </TabsList>
          <div className="flex-grow mt-4 overflow-y-auto">
            <TabsContent value="antiguo" className="m-0">
                <ScrollArea className="h-full">
                  <BookList books={oldTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
                </ScrollArea>
            </TabsContent>
            <TabsContent value="nuevo" className="m-0">
              <ScrollArea className="h-full">
                <BookList books={newTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
