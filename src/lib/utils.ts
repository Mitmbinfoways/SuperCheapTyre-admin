import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProductImageUrl(filename: any) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  console.log(BASE_URL)
  return `${BASE_URL}/Product/${filename}`;
}
