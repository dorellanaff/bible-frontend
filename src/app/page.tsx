
"use client"

import { useState, useEffect, useCallback } from 'react'
import type { Book, type VerseData, type BibleVersion } from '@/lib/bible-data'
import { getBibleVersions, getBibleBooks } from '@/lib/bible-data'
import { getChapterFromDb, saveChapterToDb, isVersionDownloaded, deleteVersionFromDb } from '@/lib/db';
import { AppHeader } from '@/components/bible/header'
import { BookSelector } from '@/components/bible/book-selector'
import { ChapterViewer } from '@/components/bible/chapter-viewer'
import { VerseComparisonDialog } from '@/components/bible/verse-comparison-dialog'
import { ConcordanceDialog } from '@/components/bible/concordance-dialog'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type SelectedVerse = { book: string; chapter: number; verse: number; text: string; version: string; };

export default function Home() {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [version, setVersion] = useState<string>('NVI')
  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [textSize, setTextSize] = useState(1)
  
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [isCompareOpen, setCompareOpen] = useState(false);
  const [isConcordanceOpen, setConcordanceOpen] = useState(false);
  const [isClient, setIsClient] = useState(false)
  
  const [chapterContent, setChapterContent] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mobileView, setMobileView] = useState<'selection' | 'reading'>('selection');
  const isMobile = useIsMobile();


  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      const [fetchedVersions, fetchedBooks] = await Promise.all([getBibleVersions(), getBibleBooks()]);
      setVersions(fetchedVersions);
      setBooks(fetchedBooks);

      if (fetchedVersions.length > 0 && !localStorage.getItem('bible-version')) {
        const defaultVersion = fetchedVersions.find(v => v.abbreviation === 'NVI') || fetchedVersions[0];
        setVersion(defaultVersion.abbreviation);
      }
    }
    fetchData();
  }, []);

  // Effect to run on client-side mount
  useEffect(() => {
    setIsClient(true)

    // Load saved settings from localStorage
    const storedVersion = localStorage.getItem('bible-version');
    const storedBookName = localStorage.getItem('bible-book');
    const storedChapter = localStorage.getItem('bible-chapter');
    const storedTextSize = localStorage.getItem('bible-text-size');

    if (storedVersion) {
      setVersion(storedVersion);
    }

    if (storedBookName && books.length > 0) {
      const foundBook = books.find(b => b.name === storedBookName);
      if (foundBook) {
        setBook(foundBook);
      }
    }

    if (storedChapter) {
      const chapterNum = parseInt(storedChapter, 10);
      setChapter(chapterNum);
      if (isMobile && storedBookName) {
        setMobileView('reading');
      }
    }
    
    if (storedTextSize) {
      const size = parseFloat(storedTextSize)
      setTextSize(size)
      document.documentElement.style.setProperty('--text-size', size.toString())
    }
  }, [books, isMobile])
  
  // Effect to save settings to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('bible-version', version);
      if (book) {
        localStorage.setItem('bible-book', book.name);
      }
      if (chapter !== null) {
        localStorage.setItem('bible-chapter', chapter.toString());
      }
    }
  }, [version, book, chapter, isClient]);

  const fetchChapterContent = useCallback(async () => {
    if (!book || !chapter || !version) return;
    
    setIsLoading(true);
    setChapterContent([]); // Clear previous content

    try {
      const dbContent = await getChapterFromDb(version, book, chapter);
      if (dbContent) {
        setChapterContent(dbContent);
        return;
      }

      const bookName = book.name.toLowerCase().replace(/ /g, '');
      const apiVersion = version === 'RVR1960' ? 'RV1960' : version;
      const response = await fetch(`${API_BASE_URL}/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      const content = data.chapter?.[0]?.data || [];
      setChapterContent(content);

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
  
  const handleChapterSelect = (selectedChapter: number) => {
    setChapter(selectedChapter)
    if (isMobile) {
      setMobileView('reading');
      window.scrollTo(0, 0);
    }
  }

  const handleBackToSelection = () => {
    setMobileView('selection');
  }

  const handleCompare = (verse: SelectedVerse) => {
    setSelectedVerse(verse);
    setCompareOpen(true);
  }

  const handleConcordance = (verse: SelectedVerse) => {
    setSelectedVerse(verse);
    setConcordanceOpen(true);
  }
  
  const handleDownloadVersion = async (versionToDownload: string) => {
    toast({ title: `Iniciando descarga de ${versionToDownload}`, description: "Esto puede tardar unos momentos..." });
    try {
      await isVersionDownloaded(versionToDownload, true); // Mark as downloading

      for (const currentBook of books) {
        for (let currentChapter = 1; currentChapter <= currentBook.chapters; currentChapter++) {
          const existing = await getChapterFromDb(versionToDownload, currentBook, currentChapter);
          if (existing) continue;

          const bookName = currentBook.name.toLowerCase().replace(/ /g, '');
          const apiVersion = versionToDownload === 'RVR1960' ? 'RV1960' : versionToDownload;
          const response = await fetch(`${API_BASE_URL}/api/bible/${bookName}/${currentChapter}?version=${apiVersion}`);
          
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
      await isVersionDownloaded(versionToDownload, false); // Unmark on failure
    }
  }

  const handleDeleteVersion = async (versionToDelete: string) => {
    toast({ title: `Eliminando ${versionToDelete} de la memoria local...` });
    try {
      await deleteVersionFromDb(versionToDelete, books);
      toast({ title: "Versión Eliminada", description: `La versión ${versionToDelete} ha sido eliminada del almacenamiento local.` });
    } catch (error) {
      console.error("Failed to delete version:", error);
      toast({ variant: "destructive", title: "Error al Eliminar", description: `No se pudo eliminar la versión ${versionToDelete}.` });
    }
  }

  if (!isClient) {
    return null;
  }

  const oldTestamentBooks = books.filter(b => b.testament === 'AT');
  const newTestamentBooks = books.filter(b => b.testament === 'NT');
  
  const showReadingView = book && chapter;
  const showMobileSelectionView = isMobile && mobileView === 'selection';
  const showMobileReadingView = isMobile && mobileView === 'reading';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader 
        textSize={textSize} 
        onTextSizeChange={handleTextSizeChange} 
        showBack={showMobileReadingView}
        onBack={handleBackToSelection}
        versions={versions}
        selectedVersion={version}
        onVersionChange={setVersion}
        onDownload={handleDownloadVersion}
        onDelete={handleDeleteVersion}
        isVersionDownloaded={isVersionDownloaded}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={cn(
            "w-full lg:w-1/3 xl:w-1/4 space-y-6 lg:sticky lg:top-8 self-start",
            { 'hidden lg:block': showMobileReadingView, 'block': !showMobileReadingView }
          )}>
            <BookSelector
              oldTestamentBooks={oldTestamentBooks}
              newTestamentBooks={newTestamentBooks}
              selectedBook={book}
              onBookSelect={handleBookSelect}
              selectedChapter={chapter}
              onChapterSelect={handleChapterSelect}
            />
          </aside>
          
          <section className={cn(
            "w-full lg:w-2/3 xl:w-3/4",
            { 'hidden': showMobileSelectionView, 'block': !showMobileSelectionView }
          )}>
            {showReadingView ? (
              <ChapterViewer
                book={book}
                chapter={chapter}
                version={version}
                content={chapterContent}
                isLoading={isLoading}
                onCompareVerse={handleCompare}
                onConcordance={handleConcordance}
              />
            ) : (
                <Card className="card-material flex items-center justify-center h-96">
                    <CardContent className="text-center text-muted-foreground p-6">
                        <h3 className="text-2xl font-headline">Bienvenido a Biblia</h3>
                        <p className="mt-2">Por favor, selecciona un libro y capítulo para comenzar a leer.</p>
                    </CardContent>
                </Card>
            )}
          </section>
        </div>
      </main>
      
      {selectedVerse && (
        <>
          <VerseComparisonDialog
            isOpen={isCompareOpen}
            onOpenChange={setCompareOpen}
            verseInfo={selectedVerse}
            versions={versions}
            books={books}
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
