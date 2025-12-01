import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatPhoneNumberIntl } from 'react-phone-number-input';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProductImageUrl(filename: any) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  return `${BASE_URL}/Product/${filename}`;
}

export function getAdminProfile(filename: any) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  return `${BASE_URL}/AdminProfile/${filename}`;
}

export function getBrandImageUrl(filename: any) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  return `${BASE_URL}/Brand/${filename}`;
}

export const formatPhoneNumber = (phoneNumber: string | undefined) => {
  if (!phoneNumber) return "";
  try {
    // formatPhoneNumberIntl handles the formatting based on the country code in the string
    return formatPhoneNumberIntl(phoneNumber) || phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
};
