// src/lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { BibleVersion, Book, VerseData, BIBLE_BOOKS_OT, BIBLE_BOOKS_NT } from './bible-data';

const DB_NAME = 'bible-db';
const DB_VERSION = 1;
const STORE_NAME = 'bible-versions';

interface BibleDB extends DBSchema {
  [STORE_NAME]: {
    key: string; // Composite key: `${version}-${bookAbbr}-${chapter}`
    value: VerseData[];
  };
}

let dbPromise: Promise<IDBPDatabase<BibleDB>> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<BibleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
};

export const getChapterFromDb = async (version: BibleVersion, book: Book, chapter: number): Promise<VerseData[] | undefined> => {
  const db = await getDb();
  const key = `${version}-${book.abbreviation}-${chapter}`;
  return db.get(STORE_NAME, key);
};

export const saveChapterToDb = async (version: BibleVersion, book: Book, chapter: number, data: VerseData[]): Promise<void> => {
  const db = await getDb();
  const key = `${version}-${book.abbreviation}-${chapter}`;
  await db.put(STORE_NAME, data, key);
};

export const isVersionDownloaded = async (version: BibleVersion): Promise<boolean> => {
  const db = await getDb();
  const allBooks = [...BIBLE_BOOKS_OT, ...BIBLE_BOOKS_NT];
  const firstBook = allBooks[0];
  const firstChapterKey = `${version}-${firstBook.abbreviation}-1`;
  const result = await db.get(STORE_NAME, firstChapterKey);
  return !!result;
};

export const deleteVersionFromDb = async (version: BibleVersion): Promise<void> => {
    const db = await getDb();
    const allBooks = [...BIBLE_BOOKS_OT, ...BIBLE_BOOKS_NT];
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const deletePromises: Promise<void>[] = [];

    for (const book of allBooks) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
            const key = `${version}-${book.abbreviation}-${chapter}`;
            deletePromises.push(store.delete(key));
        }
    }

    await Promise.all([...deletePromises, tx.done]);
};
