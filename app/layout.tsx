import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Սարքավորումների Ամրագրում",
  description: "Համակարգի կառավարման վահանակ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hy"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 📱 ՈՒՂՂՈՒՄ. Ավելացրինք overflow-x-hidden, որ էջը կողքերից չկոտրվի */}
      <body className="min-h-full flex flex-col bg-slate-200 overflow-x-hidden">
        <main className="flex-1 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}