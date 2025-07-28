export const BIBLE_VERSIONS = ['NVI', 'RVR1960', 'LBLA'] as const;
export type BibleVersion = typeof BIBLE_VERSIONS[number];

export interface Book {
  name: string;
  chapters: number;
  abbreviation: string;
}

export const BIBLE_BOOKS_OT: Book[] = [
    { name: 'Génesis', chapters: 50, abbreviation: 'gn' },
    { name: 'Éxodo', chapters: 40, abbreviation: 'ex' },
    { name: 'Levítico', chapters: 27, abbreviation: 'lev' },
    { name: 'Números', chapters: 36, abbreviation: 'num' },
    { name: 'Deuteronomio', chapters: 34, abbreviation: 'dt' },
];

export const BIBLE_BOOKS_NT: Book[] = [
    { name: 'Mateo', chapters: 28, abbreviation: 'mt' },
    { name: 'Marcos', chapters: 16, abbreviation: 'mk' },
    { name: 'Lucas', chapters: 24, abbreviation: 'lk' },
    { name: 'Juan', chapters: 21, abbreviation: 'jn' },
    { name: 'Hechos', chapters: 28, abbreviation: 'acts' },
    { name: 'Filipenses', chapters: 4, abbreviation: 'fil' },
];

export interface VerseData {
    number: number;
    text: string;
    type: 'title' | 'verse';
}
