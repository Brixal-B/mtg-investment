
import type { Metadata } from "next";
import "./globals.css";
import DropdownNav from "./components/DropdownNav";
import MagicPlayerNav from "@/components/MagicPlayerNav";

export const metadata: Metadata = {
  title: "MTG Investment App - Magic Player Tools",
  description: "Track your Magic: The Gathering collection, build decks, manage wishlists, and analyze card investments",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-950 text-gray-100 min-h-screen font-sans">
        {/* Magic Player Navigation */}
        <MagicPlayerNav />
        
        {/* Main Content Area - Mobile First Responsive */}
        <div className="lg:ml-80">
          {/* Original Header for Admin/Legacy Pages - Mobile Optimized */}
          <header className="w-full flex items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gray-900/95 backdrop-blur border-b border-gray-800">
            {/* Hide DropdownNav on mobile, show only on larger screens */}
            <div className="hidden sm:block">
              <DropdownNav />
            </div>
            <span className="ml-0 sm:ml-4 text-lg sm:text-xl font-bold tracking-tight text-gray-200">
              <span className="hidden sm:inline">MTG Investment App</span>
              <span className="sm:hidden">MTG</span>
            </span>
            <div className="ml-auto">
              <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Enhanced for Magic Players</span>
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
