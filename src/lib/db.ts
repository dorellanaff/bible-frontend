// src/lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book, VerseData } from './bible-data';

const DB_NAME = 'bible-db';
const DB_VERSION = 2; // Incremented version to trigger upgrade
const BIBLE_STORE_NAME = 'bible-versions';
const DOWNLOAD_STATUS_STORE_NAME = 'download-status';


interface BibleDB extends DBSchema {
  [BIBLE_STORE_NAME]: {
    key: string; // Composite key: `${version}-${bookName}-${chapter}`
    value: VerseData[];
  };
  [DOWNLOAD_STATUS_STORE_NAME]: {
    key: string; // version abbreviation
    value: boolean; // true if downloaded/downloading
  }
}

let dbPromise: Promise<IDBPDatabase<BibleDB>> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<BibleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(BIBLE_STORE_NAME)) {
            db.createObjectStore(BIBLE_STORE_NAME);
        }
        if (!db.objectStoreNames.contains(DOWNLOAD_STATUS_STORE_NAME)) {
            db.createObjectStore(DOWNLOAD_STATUS_STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

const getBookKey = (book: Book) => book.name.toLowerCase().replace(/ /g, '');

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
