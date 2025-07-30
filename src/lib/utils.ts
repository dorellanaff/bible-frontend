import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string) {
  if (!str) return "";
  // Capitalize the first letter and leave the rest as is.
  // This avoids lower-casing accented characters like in "Éxodo".
  return str.charAt(0).toUpperCase() + str.slice(1);
}
