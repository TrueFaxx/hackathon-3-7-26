import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitGuardian - Autonomous Code Review",
  description:
    "AI-powered code review that catches vulnerabilities, enforces standards, and auto-merges safe pull requests.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
