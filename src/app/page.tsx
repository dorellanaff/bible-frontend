"use client"

import { useState, useEffect, useMemo } from 'react'
import { BIBLE_VERSIONS, BIBLE_BOOKS_NT, BIBLE_BOOKS_OT, BIBLE_DATA, type BibleVersion, type Book } from '@/lib/bible-data'
import { AppHeader } from '@/components/bible/header'
import { VersionSelector } from '@/components/bible/version-selector'
import { BookSelector } from '@/components/bible/book-selector'
import { ChapterViewer } from '@/components/bible/chapter-viewer'
import { VerseComparisonDialog } from '@/components/bible/verse-comparison-dialog'

type SelectedVerse = { book: string; chapter: number; verse: number };

export default function Home() {
  const [version, setVersion] = useState<BibleVersion>('NVI')
  const [book, setBook] = useState<Book>(BIBLE_BOOKS_OT[0])
  const [chapter, setChapter] = useState<number>(1)
  const [textSize, setTextSize] = useState(1)
  
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [isCompareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const storedTextSize = localStorage.getItem('bible-text-size')
    if (storedTextSize) {
      const size = parseFloat(storedTextSize)
      setTextSize(size)
      document.documentElement.style.setProperty('--text-size', size.toString())
    }
  }, [])

  const handleTextSizeChange = (newSize: number) => {
    setTextSize(newSize)
    localStorage.setItem('bible-text-size', newSize.toString())
    document.documentElement.style.setProperty('--text-size', newSize.toString())
  }

  const handleBookSelect = (selectedBook: Book) => {
    setBook(selectedBook)
    setChapter(1) // Reset to chapter 1 when a new book is selected
  }

  const handleCompare = (verse: SelectedVerse) => {
    setSelectedVerse(verse);
    setCompareOpen(true);
  }

  const chapterContent = useMemo(() => {
    return BIBLE_DATA[version]?.[book.name]?.[chapter] || {}
  }, [version, book, chapter])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader textSize={textSize} onTextSizeChange={handleTextSizeChange} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-6 lg:sticky lg:top-8 self-start">
            <VersionSelector
              versions={BIBLE_VERSIONS}
              selectedVersion={version}
              onVersionChange={setVersion}
            />
            <BookSelector
              oldTestamentBooks={BIBLE_BOOKS_OT}
              newTestamentBooks={BIBLE_BOOKS_NT}
              selectedBook={book}
              onBookSelect={handleBookSelect}
              selectedChapter={chapter}
              onChapterSelect={setChapter}
            />
          </aside>
          <section className="w-full lg:w-2/3 xl:w-3/4">
            <ChapterViewer
              book={book}
              chapter={chapter}
              content={chapterContent}
              onCompareVerse={handleCompare}
            />
          </section>
        </div>
      </main>
      
      {selectedVerse && (
        <VerseComparisonDialog
          isOpen={isCompareOpen}
          onOpenChange={setCompareOpen}
          verseInfo={selectedVerse}
        />
      )}
    </div>
  )
}
