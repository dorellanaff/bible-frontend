
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Book, VerseData, BibleVersion } from '@/lib/bible-data'
import { getBibleVersions, getBibleBooks } from '@/lib/bible-data'
import { getChapterFromDb, saveChapterToDb, isVersionDownloaded, deleteVersionFromDb, getAllHighlightedVerses, HighlightedVerse, saveHighlightedVerse, removeHighlightedVerse, getHighlightForVerse, getHighlightedVersesForBook } from '@/lib/db';
import { AppHeader } from '@/components/bible/header'
import { BookSelector } from '@/components/bible/book-selector'
import { ChapterViewer } from '@/components/bible/chapter-viewer'
import { VerseComparisonDialog } from '@/components/bible/verse-comparison-dialog'
import { ConcordanceDialog } from '@/components/bible/concordance-dialog'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, toTitleCase } from '@/lib/utils';
import { ChapterSelectorDrawer } from '@/components/bible/chapter-selector-drawer';
import { LoadingAnimation } from '@/components/bible/loading-animation';
import { HighlightedVersesDialog } from '@/components/bible/highlighted-verses-dialog';
import { InfoDialog } from '@/components/bible/info-dialog';
import { API_BASE_URL } from '@/lib/api';

type SelectedVerse = { book: string; chapter: number; verse: number; text: string; version: string; references?: { source: string; target: string }[] };

export default function Home() {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [version, setVersion] = useState<string>('')
  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [textSize, setTextSize] = useState(1)
  
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [isCompareOpen, setCompareOpen] = useState(false);
  const [isConcordanceOpen, setConcordanceOpen] = useState(false);
  const [isHighlightsOpen, setHighlightsOpen] = useState(false);
  const [bookForHighlights, setBookForHighlights] = useState<Book | null>(null);
  const [isInfoDialogOpen, setInfoDialogOpen] = useState(false);

  const [isChapterSelectorOpen, setChapterSelectorOpen] = useState(false);
  const [isClient, setIsClient] = useState(false)
  const [isStateRestored, setIsStateRestored] = useState(false);
  
  const [chapterContent, setChapterContent] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mobileView, setMobileView] = useState<'selection' | 'reading'>('selection');
  const isMobile = useIsMobile();
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const chapterViewerRef = useRef<HTMLDivElement>(null);
  const [comparisonVersions, setComparisonVersions] = useState<string[]>([]);

  const [highlightedVerses, setHighlightedVerses] = useState<HighlightedVerse[]>([]);


  const { toast } = useToast();

  const fetchHighlightedVerses = useCallback(async () => {
    const highlights = await getAllHighlightedVerses();
    setHighlightedVerses(highlights);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const [fetchedVersions, fetchedBooks] = await Promise.all([getBibleVersions(), getBibleBooks(), fetchHighlightedVerses()]);
      setVersions(fetchedVersions);
      setBooks(fetchedBooks);

      const storedVersion = localStorage.getItem('bible-version');
      if (storedVersion) {
        setVersion(storedVersion);
      } else if (fetchedVersions.length > 0) {
        setVersion(fetchedVersions[0].abbreviation);
      }
    }
    fetchData();
  }, [fetchHighlightedVerses]);

  // Effect to run on client-side mount
  useEffect(() => {
    setIsClient(true)

    // Load saved settings from localStorage
    const storedTextSize = localStorage.getItem('bible-text-size');
    const storedComparisonVersions = localStorage.getItem('bible-comparison-versions');

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
    if (isClient && books.length > 0 && !isStateRestored) {
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
        setIsStateRestored(true);
    }
  }, [books, isMobile, isClient, isStateRestored]);
  
  // Effect to save settings to localStorage
  useEffect(() => {
    if (isClient) {
      if (version) {
        localStorage.setItem('bible-version', version);
      }
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
        if (!chapterViewerRef.current) return;

        const contentElement = chapterViewerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = contentElement;
        
        const totalScrollableHeight = scrollHeight - clientHeight;
        
        if (totalScrollableHeight > 0) {
            const currentProgress = (scrollTop / totalScrollableHeight) * 100;
            setScrollProgress(currentProgress);
        } else {
            setScrollProgress(0);
        }
    };
    
    const contentElement = chapterViewerRef.current;
    if (contentElement) {
        contentElement.addEventListener('scroll', handleScroll);
        // Recalculate on chapter change
        handleScroll();
    }

    return () => {
        if (contentElement) {
            contentElement.removeEventListener('scroll', handleScroll);
        }
    };
  }, [chapterContent]);

  useEffect(() => {
    if (!book || chapter === null || !version) return;

    const fetchChapterContent = async () => {
      setIsLoading(true);
      setChapterContent([]);
      
      if (chapterViewerRef.current) {
        chapterViewerRef.current.scrollTop = 0;
      }
      
      try {
        const dbContent = await getChapterFromDb(version, book, chapter);
        if (dbContent) {
          setChapterContent(dbContent);
          return;
        }

        const bookName = book.name.toLowerCase().replace(/ /g, '');
        const apiVersion = version;
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
    }
  }
  
  const handleChapterSelect = (selectedChapter: number) => {
    setChapter(selectedChapter)
    setChapterSelectorOpen(false);
    if (chapterViewerRef.current) {
      chapterViewerRef.current.scrollTop = 0;
    }
    if (isMobile) {
      setMobileView('reading');
    }
  }
  
  const handleHeaderBookSelect = () => {
    if (isMobile) {
      setMobileView(prev => prev === 'reading' ? 'selection' : 'reading');
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

  const handleHighlight = async (verseInfo: SelectedVerse, color: string | null) => {
    const { book, chapter, verse, text, version, references } = verseInfo;
    if (color) {
      await saveHighlightedVerse({ book, chapter, verse, text, color, version, references });
    } else {
      await removeHighlightedVerse(version, book, chapter, verse);
    }
    fetchHighlightedVerses(); // Refresh highlights
  };

  const handleShowHighlights = (selectedBook: Book) => {
    setBookForHighlights(selectedBook);
    setHighlightsOpen(true);
  }

  const handleNavigateToHighlight = (highlight: HighlightedVerse) => {
    const targetBook = books.find(b => b.name === highlight.book);
    if (targetBook) {
        setBook(targetBook);
        setChapter(highlight.chapter);
        setHighlightsOpen(false);
        if(isMobile) {
            setMobileView('reading');
        }
        
        setTimeout(() => {
            const verseElement = document.getElementById(`verse-${highlight.chapter}-${highlight.verse}`);
            if (verseElement && chapterViewerRef.current) {
                chapterViewerRef.current.scrollTo({ 
                    top: verseElement.offsetTop - chapterViewerRef.current.offsetTop, 
                    behavior: 'smooth' 
                });
            }
        }, 500); // Delay to allow chapter to render
    }
  };

  const handleDataRefresh = async () => {
    toast({ title: "Actualizando datos...", description: "Por favor, espera un momento." });
    try {
        localStorage.clear();
        window.location.reload();
    } catch (error) {
        console.error("Failed to refresh data:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron actualizar los datos." });
    }
  };

  const handleOpenInfo = () => {
    setInfoDialogOpen(true);
  }


  if (!isClient || !isStateRestored) {
    return <LoadingAnimation />;
  }

  const oldTestamentBooks = books.filter(b => b.testament === 'AT');
  const newTestamentBooks = books.filter(b => b.testament === 'NT');
  
  const showReadingView = book && chapter;
  const showMobileSelectionView = isMobile && mobileView === 'selection';
  const showMobileReadingView = isMobile && mobileView === 'reading' && showReadingView;

  const versionsForComparison = versions.filter(v => comparisonVersions.includes(v.abbreviation));

  const highlightCounts = books.reduce((acc, book) => {
    acc[book.name] = highlightedVerses.filter(h => h.book === book.name).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
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
        onDataRefresh={handleDataRefresh}
        onInfo={handleOpenInfo}
      />
      <main className="flex-1 flex overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8 w-full h-full p-4 sm:p-6 lg:p-8">
          <aside className={cn(
            "w-full lg:w-1/3 xl:w-1/4 h-full pt-1",
            { 'hidden lg:block': showMobileReadingView, 'block': !showMobileReadingView }
          )}>
            <BookSelector
              oldTestamentBooks={oldTestamentBooks}
              newTestamentBooks={newTestamentBooks}
              selectedBook={book}
              onBookSelect={handleBookSelect}
              highlightCounts={highlightCounts}
              onShowHighlights={handleShowHighlights}
            />
          </aside>
          
          <section className={cn(
            "w-full lg:w-2/3 xl:w-3/4 flex-grow flex flex-col h-full",
            { 'hidden': showMobileSelectionView, 'block': !showMobileSelectionView }
          )}>
            <div className="w-full h-full overflow-y-auto" ref={chapterViewerRef}>
              {showReadingView ? (
                <ChapterViewer
                  book={book}
                  chapter={chapter}
                  version={version}
                  content={chapterContent}
                  isLoading={isLoading}
                  onCompareVerse={handleCompare}
                  onConcordance={handleConcordance}
                  onHighlight={handleHighlight}
                  getHighlightForVerse={getHighlightForVerse}
                  onNextChapter={handleNextChapter}
                  onPreviousChapter={handlePreviousChapter}
                  isMobile={isMobile}
                />
              ) : (
                  <Card className="card-material flex items-center justify-center h-full">
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

      {bookForHighlights && (
         <HighlightedVersesDialog
            isOpen={isHighlightsOpen}
            onOpenChange={setHighlightsOpen}
            book={bookForHighlights}
            getHighlightedVersesForBook={getHighlightedVersesForBook}
            onNavigate={handleNavigateToHighlight}
         />
      )}
       <InfoDialog isOpen={isInfoDialogOpen} onOpenChange={setInfoDialogOpen} />
    </div>
  )
}
    

    

    
