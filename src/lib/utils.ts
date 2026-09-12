import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOptimizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  
  // Transform Google Drive uc links to thumbnail links which are more reliable for embedding
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (ucMatch && ucMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1000`;
  }
  
  return url;
}
