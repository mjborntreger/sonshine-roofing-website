import localFont from "next/font/local";

export const allura = localFont({
  src: [
    {
      path: "../../public/fonts/allura-v23-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-allura",
  display: "swap",
  preload: true,
});
