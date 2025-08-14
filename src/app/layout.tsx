
import type { Metadata } from "next";
import "./globals.css";
import DropdownNav from "./components/DropdownNav";
import MagicPlayerNav from "@/components/MagicPlayerNav";

// Temporary fix for fonts to avoid network issues during build
const geistSans = {
  variable: "--font-geist-sans",
};

const geistMono = {
  variable: "--font-geist-mono",
};

export const metadata: Metadata = {
  title: "MTG Investment App - Magic Player Tools",
  description: "Track your Magic: The Gathering collection, build decks, manage wishlists, and analyze card investments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-950 text-gray-100 min-h-screen`}>
        {/* Magic Player Navigation */}
        <MagicPlayerNav />
        
        {/* Main Content Area */}
        <div className="lg:ml-80">
          {/* Original Header for Admin/Legacy Pages */}
          <header className="w-full flex items-center px-8 py-4 bg-gray-900/95 backdrop-blur border-b border-gray-800">
            <DropdownNav />
            <span className="ml-4 text-xl font-bold tracking-tight text-gray-200">MTG Investment App</span>
            <div className="ml-auto">
              <span className="text-sm text-gray-400">Enhanced for Magic Players</span>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
