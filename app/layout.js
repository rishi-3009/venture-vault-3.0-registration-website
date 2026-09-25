import { Space_Grotesk, Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Retro pixel font for the hero's "Venture Vault 3.0" — matches the
// Mario-style background. Only has one weight.
const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Venture Vault 3.0 — E-Cell RBU",
  description: "Register your team for Venture Vault 3.0.",
};

export const viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${pressStart.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-vv-black">{children}</body>
    </html>
  );
}
