import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Chat",
  description: "Get book recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
