import { Inter } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const candara = localFont({
  src: [
    { path: "../app/fonts/candara/candara-v2.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/candara/candara-v2.woff", weight: "400", style: "normal" },
    { path: "../app/fonts/candara/candara-v2.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-candara",
  preload: true,
  display: "swap"
});
