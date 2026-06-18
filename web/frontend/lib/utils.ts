import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateUrl = (url: string) => {
  if (url.startsWith("/media/")) {
    return process.env.NEXT_PUBLIC_API_URL + url;
  }
  return url;
};
