import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "NutriNexa — Nutrition Research & Analytics",
  description: "Advanced scientific nutrition research, food composition analysis, dietary assessment, recipe analysis, and research cohort analytics platform.",
  keywords: [
    "nutrition research",
    "dietary analysis",
    "food composition",
    "recipe analysis",
    "Atwater calculation",
    "anthropometrics",
    "clinical nutrition",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#F7F9F7] text-[#192520]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
