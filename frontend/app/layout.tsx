import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportIQ — AI Ticket Triage",
  description: "Instant AI-powered customer support ticket classification, urgency detection, and grounded reply drafting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ background: "var(--bg-primary)" }}>{children}</body>
    </html>
  );
}
