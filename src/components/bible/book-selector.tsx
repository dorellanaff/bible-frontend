
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
    <div className="flex flex-col space-y-2">
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
    <Card className="card-material">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Seleccionar Libro</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="antiguo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="antiguo" className="font-headline">Antiguo Testamento</TabsTrigger>
            <TabsTrigger value="nuevo" className="font-headline">Nuevo Testamento</TabsTrigger>
          </TabsList>
          <TabsContent value="antiguo" className="mt-4">
              <ScrollArea className="h-96">
                <BookList books={oldTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
              </ScrollArea>
          </TabsContent>
          <TabsContent value="nuevo" className="mt-4">
            <ScrollArea className="h-96">
              <BookList books={newTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
