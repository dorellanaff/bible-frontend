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
  id: number;
  name: string;
  chapters: number;
  testament: "AT" | "NT";
}

export async function getBibleBooks(): Promise<Book[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bible/books`);
        if (!response.ok) {
            console.error("Failed to fetch books");
            return [];
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
}


export interface VerseData {
    number: number;
    text: string;
    type: 'title' | 'verse';
}
