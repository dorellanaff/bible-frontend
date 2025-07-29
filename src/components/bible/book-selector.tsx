
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
  selectedChapter: number | null;
  onChapterSelect: (chapter: number) => void;
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

function ChapterList({ book, selectedChapter, onChapterSelect }: { book: Book, selectedChapter: number | null, onChapterSelect: (chapter: number) => void }) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  return (
    <div className="mt-4">
      <h4 className="font-headline text-lg mb-2 text-center">{book.name}</h4>
       <ScrollArea className="h-48">
        <div className="flex flex-col space-y-2 pr-4">
          {chapters.map(chapter => (
            <Button
              key={chapter}
              variant={selectedChapter === chapter ? 'default' : 'outline'}
              onClick={() => onChapterSelect(chapter)}
              className="w-full justify-center text-base py-3 h-auto"
            >
              Capítulo {chapter}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function BookSelector({ oldTestamentBooks, newTestamentBooks, selectedBook, onBookSelect, selectedChapter, onChapterSelect }: BookSelectorProps) {
  const chapterGridRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = React.useState<'books' | 'chapters'>('books');

  const handleBookSelect = (book: Book) => {
    onBookSelect(book);
    setActiveTab('chapters');
    setTimeout(() => {
        chapterGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
  
  const handleChapterSelect = (chapter: number) => {
    onChapterSelect(chapter)
    // Optional: switch back to book view on mobile after selection
    // if (window.innerWidth < 1024) {
    //    setActiveTab('books');
    // }
  }

  React.useEffect(() => {
    if (selectedBook) {
      setActiveTab('chapters');
    } else {
      setActiveTab('books');
    }
  }, [selectedBook]);

  return (
    <Card className="card-material">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Libro y Capítulo</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedBook && activeTab === 'chapters' ? (
           <div ref={chapterGridRef}>
            <Button onClick={() => setActiveTab('books')} variant="outline" className="mb-4 w-full">
              ← Cambiar Libro
            </Button>
            <ChapterList book={selectedBook} selectedChapter={selectedChapter} onChapterSelect={handleChapterSelect} />
           </div>
        ) : (
          <Tabs defaultValue="antiguo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="antiguo" className="font-headline">Antiguo Testamento</TabsTrigger>
              <TabsTrigger value="nuevo" className="font-headline">Nuevo Testamento</TabsTrigger>
            </TabsList>
            <TabsContent value="antiguo" className="mt-4">
               <ScrollArea className="h-72">
                  <BookList books={oldTestamentBooks} selectedBook={selectedBook} onBookSelect={handleBookSelect} />
               </ScrollArea>
            </TabsContent>
            <TabsContent value="nuevo" className="mt-4">
              <ScrollArea className="h-72">
                <BookList books={newTestamentBooks} selectedBook={selectedBook} onBookSelect={handleBookSelect} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
