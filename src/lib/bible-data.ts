import { API_BASE_URL } from "./api";

export interface BibleVersion {
    id: number;
    name: string;
    abbreviation: string;
}

export async function getBibleVersions(): Promise<BibleVersion[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bible/versions`);
        if (!response.ok) {
            console.error("Failed to fetch versions");
            return [];
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching versions:", error);
        return [];
    }
}


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

export const ALL_BIBLE_BOOKS: Book[] = [...BIBLE_BOOKS_OT, ...BIBLE_BOOKS_NT];

export interface VerseData {
    number: number;
    text: string;
    type: 'title' | 'verse';
}
