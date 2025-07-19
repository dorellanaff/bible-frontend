export const BIBLE_VERSIONS = ['NVI', 'RVR1960', 'LBLA'] as const;
export type BibleVersion = typeof BIBLE_VERSIONS[number];

export interface Book {
  name: string;
  chapters: number;
}

export const BIBLE_BOOKS_OT: Book[] = [
  { name: 'Génesis', chapters: 50 },
  { name: 'Éxodo', chapters: 40 },
  { name: 'Levítico', chapters: 27 },
  { name: 'Números', chapters: 36 },
  { name: 'Deuteronomio', chapters: 34 },
];

export const BIBLE_BOOKS_NT: Book[] = [
  { name: 'Mateo', chapters: 28 },
  { name: 'Marcos', chapters: 16 },
  { name: 'Lucas', chapters: 24 },
  { name: 'Juan', chapters: 21 },
  { name: 'Hechos', chapters: 28 },
];

type BibleData = {
  [version in BibleVersion]: {
    [bookName: string]: {
      [chapter: number]: {
        [verse: number]: string;
      };
    };
  };
};

const generateChapterText = (book: string, chapter: number, version: string) => {
  const verses: { [verse: number]: string } = {};
  for (let i = 1; i <= 25; i++) {
    verses[i] = `(${version}) Este es el texto para ${book} capítulo ${chapter}, versículo ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.`;
  }
  return verses;
};

const generateBookData = (books: Book[], version: string) => {
  const bookData: { [bookName: string]: { [chapter: number]: { [verse: number]: string } } } = {};
  books.forEach(book => {
    bookData[book.name] = {};
    for (let i = 1; i <= book.chapters; i++) {
      bookData[book.name][i] = generateChapterText(book.name, i, version);
    }
  });
  return bookData;
};

export const BIBLE_DATA: BibleData = {
  NVI: {
    ...generateBookData(BIBLE_BOOKS_OT, 'NVI'),
    ...generateBookData(BIBLE_BOOKS_NT, 'NVI'),
  },
  RVR1960: {
    ...generateBookData(BIBLE_BOOKS_OT, 'RVR1960'),
    ...generateBookData(BIBLE_BOOKS_NT, 'RVR1960'),
  },
  LBLA: {
    ...generateBookData(BIBLE_BOOKS_OT, 'LBLA'),
    ...generateBookData(BIBLE_BOOKS_NT, 'LBLA'),
  },
};
