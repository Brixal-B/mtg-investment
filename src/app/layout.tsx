
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DropdownNav from "./components/DropdownNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "MTG Investment App",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-950 text-gray-100 min-h-screen`}>
        <header className="w-full flex items-center px-8 py-4 bg-gray-900 border-b border-gray-800">
          <DropdownNav />
          <span className="ml-4 text-xl font-bold tracking-tight text-gray-200">MTG Investment App</span>
        </header>
        <main className="w-full flex flex-col items-center px-4 py-8">
          <div className="w-full max-w-6xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
