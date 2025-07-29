
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
import { Card, CardContent } from '@/components/ui/card';

type SelectedVerse = { book: string; chapter: number; verse: number; text: string; version: BibleVersion; };

export default function Home() {
  const [version, setVersion] = useState<BibleVersion>('NVI')
  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [textSize, setTextSize] = useState(1)
  
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [isCompareOpen, setCompareOpen] = useState(false);
  const [isConcordanceOpen, setConcordanceOpen] = useState(false);
  const [isClient, setIsClient] = useState(false)
  
  const [chapterContent, setChapterContent] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  // Effect to run on client-side mount
  useEffect(() => {
    setIsClient(true)

    // Load saved settings from localStorage
    const storedVersion = localStorage.getItem('bible-version') as BibleVersion;
    const storedBookName = localStorage.getItem('bible-book');
    const storedChapter = localStorage.getItem('bible-chapter');
    const storedTextSize = localStorage.getItem('bible-text-size');

    if (storedVersion && BIBLE_VERSIONS.includes(storedVersion)) {
      setVersion(storedVersion);
    }

    if (storedBookName) {
      const foundBook = ALL_BIBLE_BOOKS.find(b => b.name === storedBookName);
      if (foundBook) {
        setBook(foundBook);
      }
    }

    if (storedChapter) {
      setChapter(parseInt(storedChapter, 10));
    }
    
    if (storedTextSize) {
      const size = parseFloat(storedTextSize)
      setTextSize(size)
      document.documentElement.style.setProperty('--text-size', size.toString())
    }
  }, [])
  
  // Effect to save settings to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('bible-version', version);
      if (book) {
        localStorage.setItem('bible-book', book.name);
      }
      if (chapter) {
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
        // Check if we need to save this version's chapter locally after fetching from DB
        const versionIsMarkedForDownload = await isVersionDownloaded(version);
        if (versionIsMarkedForDownload) {
          // This might be redundant if already in DB, but ensures consistency
          await saveChapterToDb(version, book, chapter, dbContent);
        }
        return;
      }

      const bookName = book.name.toLowerCase().replace(/ /g, '');
      const apiVersion = version === 'RVR1960' ? 'RV1960' : version;
      const response = await fetch(`https://bible-daniel.ddns.net/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
      
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
          if (existing) continue;

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
              onChapterSelect={handleChapterSelect}
            />
          </aside>
          <section className="w-full lg:w-2/3 xl:w-3/4">
            {book && chapter ? (
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
                <Card className="bg-card shadow-lg flex items-center justify-center h-96">
                    <CardContent className="text-center text-muted-foreground p-6">
                        <h3 className="text-2xl font-headline">Bienvenido a Biblia Viva</h3>
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
