// src/lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book, VerseData } from './bible-data';

const DB_NAME = 'bible-db';
const DB_VERSION = 3; // Incremented version to trigger upgrade
const BIBLE_STORE_NAME = 'bible-versions';
const DOWNLOAD_STATUS_STORE_NAME = 'download-status';
const HIGHLIGHTED_VERSES_STORE_NAME = 'highlighted-verses';

export interface HighlightedVerse {
  id: string; // `${version}-${bookName}-${chapter}-${verse}`
  book: string;
  chapter: number;
  verse: number;
  text: string;
  color: string;
  version: string;
  createdAt: Date;
}

interface BibleDB extends DBSchema {
  [BIBLE_STORE_NAME]: {
    key: string; // Composite key: `${version}-${bookName}-${chapter}`
    value: VerseData[];
  };
  [DOWNLOAD_STATUS_STORE_NAME]: {
    key: string; // version abbreviation
    value: boolean; // true if downloaded/downloading
  };
  [HIGHLIGHTED_VERSES_STORE_NAME]: {
    key: string;
    value: HighlightedVerse;
    indexes: { 'book': string };
  }
}

let dbPromise: Promise<IDBPDatabase<BibleDB>> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<BibleDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(BIBLE_STORE_NAME)) {
            db.createObjectStore(BIBLE_STORE_NAME);
        }
        if (!db.objectStoreNames.contains(DOWNLOAD_STATUS_STORE_NAME)) {
            db.createObjectStore(DOWNLOAD_STATUS_STORE_NAME);
        }
        if (oldVersion < 3) {
            if (db.objectStoreNames.contains(HIGHLIGHTED_VERSES_STORE_NAME)) {
                db.deleteObjectStore(HIGHLIGHTED_VERSES_STORE_NAME);
            }
            const store = db.createObjectStore(HIGHLIGHTED_VERSES_STORE_NAME, { keyPath: 'id' });
            store.createIndex('book', 'book');
        }
      },
    });
  }
  return dbPromise;
};

const getBookKey = (book: Book | string) => {
    const name = typeof book === 'string' ? book : book.name;
    return name.toLowerCase().replace(/ /g, '');
}

export const getChapterFromDb = async (version: string, book: Book, chapter: number): Promise<VerseData[] | undefined> => {
  const db = await getDb();
  const key = `${version}-${getBookKey(book)}-${chapter}`;
  return db.get(BIBLE_STORE_NAME, key);
};

export const saveChapterToDb = async (version: string, book: Book, chapter: number, data: VerseData[]): Promise<void> => {
  const db = await getDb();
  const key = `${version}-${getBookKey(book)}-${chapter}`;
  await db.put(BIBLE_STORE_NAME, data, key);
};

export const isVersionDownloaded = async (version: string, markAsDownloading?: boolean): Promise<boolean> => {
  const db = await getDb();
  if (markAsDownloading !== undefined) {
      await db.put(DOWNLOAD_STATUS_STORE_NAME, markAsDownloading, version);
  }
  const status = await db.get(DOWNLOAD_STATUS_STORE_NAME, version);
  return !!status;
};

export const deleteVersionFromDb = async (version: string, allBooks: Book[]): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction([BIBLE_STORE_NAME, DOWNLOAD_STATUS_STORE_NAME], 'readwrite');
    const bibleStore = tx.objectStore(BIBLE_STORE_NAME);
    const statusStore = tx.objectStore(DOWNLOAD_STATUS_STORE_NAME);

    const deletePromises: Promise<void>[] = [];

    for (const book of allBooks) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
            const key = `${version}-${getBookKey(book)}-${chapter}`;
            deletePromises.push(bibleStore.delete(key));
        }
    }
    deletePromises.push(statusStore.delete(version));

    await Promise.all([...deletePromises, tx.done]);
};


// --- Highlighted Verses Functions ---

const getHighlightId = (version: string, book: string, chapter: number, verse: number) => {
    return `${version}-${getBookKey(book)}-${chapter}-${verse}`;
}

export const saveHighlightedVerse = async (verseInfo: Omit<HighlightedVerse, 'id' | 'createdAt'>): Promise<void> => {
    const db = await getDb();
    const id = getHighlightId(verseInfo.version, verseInfo.book, verseInfo.chapter, verseInfo.verse);
    await db.put(HIGHLIGHTED_VERSES_STORE_NAME, { ...verseInfo, id, createdAt: new Date() });
}

export const removeHighlightedVerse = async (version: string, book: string, chapter: number, verse: number): Promise<void> => {
    const db = await getDb();
    const id = getHighlightId(version, book, chapter, verse);
    await db.delete(HIGHLIGHTED_VERSES_STORE_NAME, id);
}

export const getHighlightForVerse = async (version: string, book: string, chapter: number, verse: number): Promise<HighlightedVerse | undefined> => {
    const db = await getDb();
    const id = getHighlightId(version, book, chapter, verse);
    return db.get(HIGHLIGHTED_VERSES_STORE_NAME, id);
}

export const getAllHighlightedVerses = async (): Promise<HighlightedVerse[]> => {
    const db = await getDb();
    return db.getAll(HIGHLIGHTED_VERSES_STORE_NAME);
}

export const getHighlightedVersesForBook = async (bookName: string): Promise<HighlightedVerse[]> => {
    const db = await getDb();
    const verses = await db.getAllFromIndex(HIGHLIGHTED_VERSES_STORE_NAME, 'book', bookName);
    return verses.sort((a,b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });
}
