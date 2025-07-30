
// src/lib/api.ts
export const API_BASE_URL = 'https://bible-daniel.ddns.net';

export async function fetchVerse(version: string, book: string, chapter: number, verse: number): Promise<string | null> {
    try {
        const bookName = book.toLowerCase().replace(/ /g, '');
        const apiVersion = version === 'RVR1960' ? 'RV1960' : version;
        const response = await fetch(`${API_BASE_URL}/api/bible/${bookName}/${chapter}?version=${apiVersion}`);
        
        if (!response.ok) {
            return `Error de red: ${response.statusText}`;
        }

        const data = await response.json();
        const verses = data.chapter?.[0]?.number;

        if (verses && Array.isArray(verses)) {
            const verseData = verses.find((v: any) => v.number === verse && v.type === 'verse');
            return verseData?.text || "No se encontró el texto del versículo en la API.";
        }

        return "La estructura de la respuesta de la API no es la esperada.";
    } catch (error) {
        console.error("Error fetching verse:", error);
        return "Error al obtener el versículo.";
    }
}
