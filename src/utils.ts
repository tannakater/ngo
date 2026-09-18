import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(currency?: string): string {
  switch (currency?.toUpperCase()) {
    case 'BDT':
      return '৳';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'USD':
    default:
      return '$';
  }
}

export function formatCurrency(amount?: number | null, currency?: string): string {
  const symbol = getCurrencySymbol(currency);
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${symbol}${safeAmount.toLocaleString()}`;
}
