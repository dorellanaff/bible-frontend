"use client"

import { useState, useEffect, useCallback } from 'react'
import { BIBLE_VERSIONS, BIBLE_BOOKS_NT, BIBLE_BOOKS_OT, type BibleVersion, type Book, type VerseData, ALL_BIBLE_BOOKS } from '@/lib/bible-data'
import { getChapterFromDb, saveChapterToDb, isVersionDownloaded, deleteVersionFromDb } from '@/lib/db';
import { AppHeader } from '@/components/bible/header'
import { VersionSelector } from '@/components/bible/version-selector'
import { BookSelector } from '@/components/bible/book-selector'
import { ChapterViewer } from '@/components/bible/chapter-viewer'
import { VerseComparisonDialog } from '@/components/bible/verse-comparison-dialog'
import { ConcordanceDialog } from '@/components/bible/concordance-dialog'
import { useToast } from "@/hooks/use-toast"

type SelectedVerse = { book: string; chapter: number; verse: number; text: string; version: BibleVersion; };

export default function Home() {
  const [version, setVersion] = useState<BibleVersion>('NVI')
  const [book, setBook] = useState<Book>(BIBLE_BOOKS_NT.find(b => b.name === 'Filipenses')!)
  const [chapter, setChapter] = useState<number>(4)
  const [textSize, setTextSize] = useState(1)
  
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [isCompareOpen, setCompareOpen] = useState(false);
  const [isConcordanceOpen, setConcordanceOpen] = useState(false);
  const [isClient, setIsClient] = useState(false)
  
  const [chapterContent, setChapterContent] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

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
      // 1. Try fetching from IndexedDB first
      const dbContent = await getChapterFromDb(version, book, chapter);
      if (dbContent) {
        setChapterContent(dbContent);
        setIsLoading(false);
        return;
      }

      // 2. If not in DB, fetch from API
      const bookName = book.name.toLowerCase().replace(/ /g, '');
      const apiVersion = version === 'RVR1960' ? 'RV1960' : version;
      const response = await fetch(`https://bible-daniel.ddns.net/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      const content = data.chapter?.[0]?.data || [];
      setChapterContent(content);

      // 3. After fetching from API, check if this version should be saved locally
      const versionIsMarkedForDownload = await isVersionDownloaded(version);
      if (versionIsMarkedForDownload) {
        await saveChapterToDb(version, book, chapter, content);
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
  
  const handleDownloadVersion = async (versionToDownload: BibleVersion) => {
    toast({ title: `Iniciando descarga de ${versionToDownload}`, description: "Esto puede tardar unos momentos..." });
    try {
      for (const currentBook of ALL_BIBLE_BOOKS) {
        for (let currentChapter = 1; currentChapter <= currentBook.chapters; currentChapter++) {
          const existing = await getChapterFromDb(versionToDownload, currentBook, currentChapter);
          if (existing) continue; // Skip if already downloaded

          const bookName = currentBook.name.toLowerCase().replace(/ /g, '');
          const apiVersion = versionToDownload === 'RVR1960' ? 'RV1960' : versionToDownload;
          const response = await fetch(`https://bible-daniel.ddns.net/api/bible/${bookName}/${currentChapter}?version=${apiVersion}`);
          
          if(response.ok) {
            const data = await response.json();
            const content = data.chapter?.[0]?.data || [];
            await saveChapterToDb(versionToDownload, currentBook, currentChapter, content);
          }
        }
      }
      toast({ title: "Descarga Completa", description: `La versión ${versionToDownload} ha sido guardada localmente.` });
    } catch (error) {
      console.error("Failed to download version:", error);
      toast({ variant: "destructive", title: "Error en la Descarga", description: `No se pudo descargar la versión ${versionToDownload}.` });
    }
  }

  const handleDeleteVersion = async (versionToDelete: BibleVersion) => {
    toast({ title: `Eliminando ${versionToDelete} de la memoria local...` });
    try {
      await deleteVersionFromDb(versionToDelete);
      toast({ title: "Versión Eliminada", description: `La versión ${versionToDelete} ha sido eliminada del almacenamiento local.` });
    } catch (error) {
      console.error("Failed to delete version:", error);
      toast({ variant: "destructive", title: "Error al Eliminar", description: `No se pudo eliminar la versión ${versionToDelete}.` });
    }
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
              onDownload={handleDownloadVersion}
              onDelete={handleDeleteVersion}
              isVersionDownloaded={isVersionDownloaded}
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
              version={version}
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
