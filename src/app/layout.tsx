import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { ThemeProvider } from "@/contexts/theme-context";

export const metadata: Metadata = {
  title: "WealthTracker - Personal Finance Dashboard",
  description: "Track your net worth, investments, debts, and cashflow in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <ThemeProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
