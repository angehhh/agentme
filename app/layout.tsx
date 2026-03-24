import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AgentMe - Tu agente trabaja mientras tú vives",
  description: "El primer agente IA diseñado para la vida de un joven ambicioso.",
};

export default function RootLayout({ children, }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfairDisplay.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink selection:bg-brand-green/20">
        {children}
      </body>
    </html>
  );
}
