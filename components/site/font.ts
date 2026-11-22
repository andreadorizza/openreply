import localFont from "next/font/local";

export const geist = localFont({
  src: "../../public/fonts/geist-latin.woff2",
  display: "swap",
  weight: "100 900",
});

// Used for the wordmark only.
export const inter = localFont({
  src: "../../public/fonts/inter-latin.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-inter",
});
