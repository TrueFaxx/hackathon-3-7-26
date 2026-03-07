import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitGuardian - AI-Powered Code Review & Auto-Merge",
  description:
    "Autonomous AI that reviews pull requests, runs tests, detects vulnerabilities, and auto-merges safe code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
