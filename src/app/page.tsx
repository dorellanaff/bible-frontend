
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Book, VerseData, BibleVersion } from '@/lib/bible-data'
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
import { ChapterSelectorDrawer } from '@/components/bible/chapter-selector-drawer';
import { LoadingAnimation } from '@/components/bible/loading-animation';

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
  const [isChapterSelectorOpen, setChapterSelectorOpen] = useState(false);
  const [isClient, setIsClient] = useState(false)
  
  const [chapterContent, setChapterContent] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mobileView, setMobileView] = useState<'selection' | 'reading'>('selection');
  const isMobile = useIsMobile();
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const chapterViewerRef = useRef<HTMLDivElement>(null);
  const [comparisonVersions, setComparisonVersions] = useState<string[]>([]);


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
    const storedTextSize = localStorage.getItem('bible-text-size');
    const storedComparisonVersions = localStorage.getItem('bible-comparison-versions');


    if (storedVersion) {
      setVersion(storedVersion);
    }

    if (storedComparisonVersions) {
      setComparisonVersions(JSON.parse(storedComparisonVersions));
    }
    
    if (storedTextSize) {
      const size = parseFloat(storedTextSize)
      setTextSize(size)
      document.documentElement.style.setProperty('--text-size', size.toString())
    }

  }, []);

  useEffect(() => {
    // Only run this effect if books have been loaded
    if (books.length > 0) {
      const storedBookName = localStorage.getItem('bible-book');
      const storedChapter = localStorage.getItem('bible-chapter');

      if (storedBookName && storedChapter) {
        const foundBook = books.find(b => b.name === storedBookName);
        if (foundBook) {
          setBook(foundBook);
          const chapterNum = parseInt(storedChapter, 10);
          setChapter(chapterNum);
          if (isMobile) {
            setMobileView('reading');
          }
        }
      }
    }
  }, [books, isMobile]);
  
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
      localStorage.setItem('bible-comparison-versions', JSON.stringify(comparisonVersions));
    }
  }, [version, book, chapter, isClient, comparisonVersions]);
  
  // Effect for scroll progress
  useEffect(() => {
    const handleScroll = () => {
        const contentElement = chapterViewerRef.current;
        if (!contentElement) return;

        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        // Use documentElement for overall page scroll
        const totalScrollableHeight = scrollHeight - clientHeight;
        
        if (totalScrollableHeight > 0) {
            const currentProgress = (scrollTop / totalScrollableHeight) * 100;
            setScrollProgress(currentProgress);
        } else {
            setScrollProgress(0);
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Recalculate on chapter change
    handleScroll();

    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
  }, [chapterContent]);

  useEffect(() => {
    if (!book || chapter === null || !version) return;

    const fetchChapterContent = async () => {
      setIsLoading(true);
      setChapterContent([]);
      
      chapterViewerRef.current?.scrollIntoView({ behavior: 'smooth' });

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
          toast({
            variant: "destructive",
            title: "Error de Conexión",
            description: "No se pudo cargar el capítulo. Por favor, revisa tu conexión a internet o inténtalo de nuevo más tarde.",
          });
          setChapterContent([]);
      } finally {
          setIsLoading(false);
      }
    };
    
    fetchChapterContent();
    
  }, [book, chapter, version, toast]);


  const handleTextSizeChange = (newSize: number) => {
    setTextSize(newSize)
    localStorage.setItem('bible-text-size', newSize.toString())
    document.documentElement.style.setProperty('--text-size', newSize.toString())
  }

  const handleBookSelect = (selectedBook: Book | null) => {
    setBook(selectedBook)
    setChapter(null) // Reset chapter selection
    if (selectedBook) {
      setChapterSelectorOpen(true);
    } else {
       chapterViewerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  const handleChapterSelect = (selectedChapter: number) => {
    setChapter(selectedChapter)
    setChapterSelectorOpen(false);
    if (isMobile) {
      setMobileView('reading');
    }
    chapterViewerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  
  const handleHeaderBookSelect = () => {
    if (isMobile) {
      setMobileView('selection');
    }
  }
  
  const handleHeaderChapterSelect = () => {
    if (book) {
      setChapterSelectorOpen(true);
    }
  }

  const handleNextChapter = () => {
    if (book && chapter && chapter < book.chapters) {
      handleChapterSelect(chapter + 1);
    }
  };

  const handlePreviousChapter = () => {
    if (book && chapter && chapter > 1) {
      handleChapterSelect(chapter - 1);
    }
  };

  const handleBackToBooks = () => {
    setChapterSelectorOpen(false);
    if (isMobile) {
      setMobileView('selection');
    }
  }

  const handleCompare = (verse: SelectedVerse) => {
    if (versions.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Las versiones aún no se han cargado. Inténtalo de nuevo en un momento." });
      return;
    }
    setSelectedVerse(verse);
    setCompareOpen(true);
  }

  const handleConcordance = (verse: SelectedVerse) => {
    setSelectedVerse(verse);
    setConcordanceOpen(true);
  }
  
  const handleDownloadVersion = async (versionToDownload: string) => {
    toast({ title: `Versión ${versionToDownload} marcada para uso sin conexión.` });
    try {
      await isVersionDownloaded(versionToDownload, true); // Mark as ready for downloading
      // Re-fetch current chapter to save it if it's from the version we just marked.
      if (versionToDownload === version && chapterContent.length > 0 && book && chapter) {
         await saveChapterToDb(version, book, chapter, chapterContent);
      }
    } catch (error) {
      console.error("Failed to mark version for download:", error);
      toast({ variant: "destructive", title: "Error", description: `No se pudo marcar la versión ${versionToDownload}.` });
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
  
  const handleToggleComparisonVersion = (versionAbbr: string) => {
    setComparisonVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionAbbr)) {
        newSet.delete(versionAbbr);
      } else {
        newSet.add(versionAbbr);
      }
      return Array.from(newSet);
    });
  };

  if (!isClient) {
    return <LoadingAnimation />;
  }

  const oldTestamentBooks = books.filter(b => b.testament === 'AT');
  const newTestamentBooks = books.filter(b => b.testament === 'NT');
  
  const showReadingView = book && chapter;
  const showMobileSelectionView = isMobile && mobileView === 'selection';
  const showMobileReadingView = isMobile && mobileView === 'reading' && showReadingView;

  const versionsForComparison = versions.filter(v => comparisonVersions.includes(v.abbreviation));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader 
        book={book}
        chapter={chapter}
        textSize={textSize} 
        onTextSizeChange={handleTextSizeChange} 
        onBookSelect={handleHeaderBookSelect}
        onChapterSelect={handleHeaderChapterSelect}
        versions={versions}
        selectedVersion={version}
        onVersionChange={setVersion}
        onDownload={handleDownloadVersion}
        onDelete={handleDeleteVersion}
        isVersionDownloaded={isVersionDownloaded}
        readingProgress={showReadingView ? scrollProgress : 0}
        comparisonVersions={comparisonVersions}
        onToggleComparisonVersion={handleToggleComparisonVersion}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={cn(
            "w-full lg:w-1/3 xl:w-1/4 lg:sticky lg:top-24 lg:self-start",
            { 'hidden lg:block': showMobileReadingView, 'block': !showMobileReadingView }
          )}>
            <BookSelector
              oldTestamentBooks={oldTestamentBooks}
              newTestamentBooks={newTestamentBooks}
              selectedBook={book}
              onBookSelect={handleBookSelect}
            />
          </aside>
          
          <section className={cn(
            "w-full lg:w-2/3 xl:w-3/4 flex-grow",
            { 'hidden': showMobileSelectionView, 'block': !showMobileSelectionView }
          )}>

            <div className="w-full" ref={chapterViewerRef}>
              {showReadingView ? (
                <ChapterViewer
                  book={book}
                  chapter={chapter}
                  version={version}
                  content={chapterContent}
                  isLoading={isLoading}
                  onCompareVerse={handleCompare}
                  onConcordance={handleConcordance}
                  onNextChapter={handleNextChapter}
                  onPreviousChapter={handlePreviousChapter}
                  onChapterSelect={() => setChapterSelectorOpen(true)}
                />
              ) : (
                  <Card className="card-material flex items-center justify-center h-96">
                      <CardContent className="text-center text-muted-foreground p-6">
                          <h3 className="text-2xl font-headline">Bienvenido a Biblia</h3>
                          <p className="mt-2">Por favor, selecciona un libro para comenzar a leer.</p>
                      </CardContent>
                  </Card>
              )}
            </div>
          </section>
        </div>
      </main>
      
      {selectedVerse && (
        <>
          <VerseComparisonDialog
            isOpen={isCompareOpen}
            onOpenChange={setCompareOpen}
            verseInfo={selectedVerse}
            versions={versionsForComparison}
            books={books}
          />
          <ConcordanceDialog
            isOpen={isConcordanceOpen}
            onOpenChange={setConcordanceOpen}
            verseInfo={selectedVerse}
          />
        </>
      )}

      {book && (
        <ChapterSelectorDrawer
          book={book}
          isOpen={isChapterSelectorOpen}
          onOpenChange={setChapterSelectorOpen}
          onChapterSelect={handleChapterSelect}
          selectedChapter={chapter}
          onGoBack={handleBackToBooks}
        />
      )}
    </div>
  )
}
    

    

    
