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
  title: "Career Copilot | AI-Powered ATS Resume Tailoring & Interview Prep",
  description: "An AI-powered career assistant delivering deterministic ATS resume formatting, Gemini 1.5 Flash gap analysis, and structured interview question synthesis.",
  openGraph: {
    title: "Career Copilot | AI-Powered ATS Resume Tailoring & Interview Prep",
    description: "An AI-powered career assistant delivering deterministic ATS resume formatting, Gemini 1.5 Flash gap analysis, and structured interview question synthesis.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
