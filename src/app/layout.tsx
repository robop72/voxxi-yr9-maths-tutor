import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voxxi — Secondary AI Tutor",
  description: "AI-powered secondary school tutor for Year 7–12, covering Maths, Science, and English. Victorian Curriculum 2.0.",
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
