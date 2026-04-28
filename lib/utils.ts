import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseLocaleNumber(value: string): number {
  if (typeof value !== 'string') return NaN
  return parseFloat(value.trim().replace(',', '.'))
}
