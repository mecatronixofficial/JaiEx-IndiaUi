import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Jai - India Enterprices - Secure File Transfer",
  description: "Fast, secure file transfer and storage platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var storedTheme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : (prefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
} catch (_) {}
            `.trim(),
          }}
        />
      </head>
      <body className="bg-(--bg) text-(--text)">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
