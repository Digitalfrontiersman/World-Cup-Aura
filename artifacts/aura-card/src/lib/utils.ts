import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppUrl(): string {
  const configured = import.meta.env.VITE_APP_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, "");
  return window.location.origin;
}
