import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/src/lib/themeContext";

export const metadata: Metadata = {
  title: "doc-to-deck",
  description: "Transform documents into structured slide decks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
