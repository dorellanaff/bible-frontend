import { API_BASE_URL } from "./api";

export interface BibleVersion {
    id: number;
    name: string;
    abbreviation: string;
}

export async function getBibleVersions(): Promise<BibleVersion[]> {
    const cacheKey = 'bible-versions-cache';
    try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (error) {
        console.error("Error reading versions from cache:", error);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bible/versions`);
        if (!response.ok) {
            console.error("Failed to fetch versions");
            return [];
        }
        const versions = await response.json();
        try {
            localStorage.setItem(cacheKey, JSON.stringify(versions));
        } catch (error) {
            console.error("Error saving versions to cache:", error);
        }
        return versions;
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
    const cacheKey = 'bible-books-cache';
    try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (error) {
        console.error("Error reading books from cache:", error);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bible/books`);
        if (!response.ok) {
            console.error("Failed to fetch books");
            return [];
        }
        const books = await response.json();
        try {
            localStorage.setItem(cacheKey, JSON.stringify(books));
        } catch (error) {
            console.error("Error saving books to cache:", error);
        }
        return books;
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
