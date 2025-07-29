
"use client"

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
  selectedChapter: number | null;
  onChapterSelect: (chapter: number) => void;
}

function BookGrid({ books, selectedBook, onBookSelect }: { books: Book[], selectedBook: Book | null, onBookSelect: (book: Book) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {books.map(book => (
        <Button
          key={book.name}
          variant={selectedBook?.name === book.name ? 'default' : 'secondary'}
          onClick={() => onBookSelect(book)}
          className="font-headline justify-start"
        >
          {book.name}
        </Button>
      ))}
    </div>
  )
}

function ChapterGrid({ book, selectedChapter, onChapterSelect }: { book: Book, selectedChapter: number | null, onChapterSelect: (chapter: number) => void }) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  return (
    <div className="mt-4">
      <h4 className="font-headline text-lg mb-2">{book.name} - Capítulos</h4>
      <ScrollArea className="h-48">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-6 gap-2 pr-4">
          {chapters.map(chapter => (
            <Button
              key={chapter}
              variant={selectedChapter === chapter ? 'default' : 'outline'}
              size="icon"
              onClick={() => onChapterSelect(chapter)}
            >
              {chapter}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function BookSelector({ oldTestamentBooks, newTestamentBooks, selectedBook, onBookSelect, selectedChapter, onChapterSelect }: BookSelectorProps) {
  return (
    <Card className="bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Libro y Capítulo</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="antiguo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="antiguo" className="font-headline">Antiguo Testamento</TabsTrigger>
            <TabsTrigger value="nuevo" className="font-headline">Nuevo Testamento</TabsTrigger>
          </TabsList>
          <TabsContent value="antiguo" className="mt-4">
            <BookGrid books={oldTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
          </TabsContent>
          <TabsContent value="nuevo" className="mt-4">
            <BookGrid books={newTestamentBooks} selectedBook={selectedBook} onBookSelect={onBookSelect} />
          </TabsContent>
        </Tabs>
        {selectedBook && (
            <div className="mt-4 border-t pt-4">
            <ChapterGrid book={selectedBook} selectedChapter={selectedChapter} onChapterSelect={onChapterSelect} />
            </div>
        )}
      </CardContent>
    </Card>
  )
}
