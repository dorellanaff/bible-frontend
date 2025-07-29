"use client"

import { useState, useEffect, useCallback } from 'react'
import { BIBLE_VERSIONS, BIBLE_BOOKS_NT, BIBLE_BOOKS_OT, type BibleVersion, type Book, type VerseData } from '@/lib/bible-data'
import { AppHeader } from '@/components/bible/header'
import { VersionSelector } from '@/components/bible/version-selector'
import { BookSelector } from '@/components/bible/book-selector'
import { ChapterViewer } from '@/components/bible/chapter-viewer'
import { VerseComparisonDialog } from '@/components/bible/verse-comparison-dialog'
import { ConcordanceDialog } from '@/components/bible/concordance-dialog'

type SelectedVerse = { book: string; chapter: number; verse: number; text: string; };

export default function Home() {
  const [version, setVersion] = useState<BibleVersion>('RVR1960')
  const [book, setBook] = useState<Book>(BIBLE_BOOKS_NT.find(b => b.name === 'Filipenses')!)
  const [chapter, setChapter] = useState<number>(4)
  const [textSize, setTextSize] = useState(1)
  
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [isCompareOpen, setCompareOpen] = useState(false);
  const [isConcordanceOpen, setConcordanceOpen] = useState(false);
  const [isClient, setIsClient] = useState(false)
  
  const [chapterContent, setChapterContent] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true)
    const storedTextSize = localStorage.getItem('bible-text-size')
    if (storedTextSize) {
      const size = parseFloat(storedTextSize)
      setTextSize(size)
      document.documentElement.style.setProperty('--text-size', size.toString())
    }
  }, [])
  
  const fetchChapterContent = useCallback(async () => {
    if (!book || !chapter || !version) return;
    setIsLoading(true);
    try {
        const bookName = book.name.toLowerCase().replace(/ /g, '');
        // Special mapping for RVR1960 version
        const apiVersion = version === 'RVR1960' ? 'RV1960' : version;
        const response = await fetch(`https://ec2-3-134-107-239.us-east-2.compute.amazonaws.com/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.chapter && data.chapter.length > 0) {
            setChapterContent(data.chapter[0].data);
        } else {
            setChapterContent([]);
        }
    } catch (error) {
        console.error("Failed to fetch chapter content:", error);
        setChapterContent([]);
    } finally {
        setIsLoading(false);
    }
  }, [book, chapter, version]);
  
  useEffect(() => {
      fetchChapterContent();
  }, [fetchChapterContent]);


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

  const handleConcordance = (verse: SelectedVerse) => {
    setSelectedVerse(verse);
    setConcordanceOpen(true);
  }

  if (!isClient) {
    return null;
  }

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
              isLoading={isLoading}
              onCompareVerse={handleCompare}
              onConcordance={handleConcordance}
            />
          </section>
        </div>
      </main>
      
      {selectedVerse && (
        <>
          <VerseComparisonDialog
            isOpen={isCompareOpen}
            onOpenChange={setCompareOpen}
            verseInfo={selectedVerse}
          />
          <ConcordanceDialog
            isOpen={isConcordanceOpen}
            onOpenChange={setConcordanceOpen}
            verseInfo={selectedVerse}
          />
        </>
      )}
    </div>
  )
}
