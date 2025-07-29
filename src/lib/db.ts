// src/lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book, VerseData } from './bible-data';

const DB_NAME = 'bible-db';
const DB_VERSION = 1;
const STORE_NAME = 'bible-versions';

interface BibleDB extends DBSchema {
  [STORE_NAME]: {
    key: string; // Composite key: `${version}-${bookName}-${chapter}`
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

const getBookKey = (book: Book) => book.name.toLowerCase().replace(/ /g, '');

export const getChapterFromDb = async (version: string, book: Book, chapter: number): Promise<VerseData[] | undefined> => {
  const db = await getDb();
  const key = `${version}-${getBookKey(book)}-${chapter}`;
  return db.get(STORE_NAME, key);
};

export const saveChapterToDb = async (version: string, book: Book, chapter: number, data: VerseData[]): Promise<void> => {
  const db = await getDb();
  const key = `${version}-${getBookKey(book)}-${chapter}`;
  await db.put(STORE_NAME, data, key);
};

export const isVersionDownloaded = async (version: string): Promise<boolean> => {
  const db = await getDb();
  // We can't know the first book without fetching, so we check if ANY key for that version exists.
  const keys = await db.getAllKeys(STORE_NAME);
  return keys.some(key => key.startsWith(`${version}-`));
};

export const deleteVersionFromDb = async (version: string, allBooks: Book[]): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const deletePromises: Promise<void>[] = [];

    for (const book of allBooks) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
            const key = `${version}-${getBookKey(book)}-${chapter}`;
            deletePromises.push(store.delete(key));
        }
    }

    await Promise.all([...deletePromises, tx.done]);
};
