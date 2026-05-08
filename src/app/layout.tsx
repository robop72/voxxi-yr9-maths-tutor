import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voxxi — Year 9 Maths Tutor",
  description: "AI-powered Year 9 Maths Tutor by Voxii",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
