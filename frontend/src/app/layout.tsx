import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExperimentHub — AI-Powered Experiment Tracking",
  description: "Track, analyze, and improve your technical experiments with AI-powered insights. A professional experiment tracking platform for students and developers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
