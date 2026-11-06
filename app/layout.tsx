import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Butterfly Scarf",
  description: "Butterfly Scarf Store",
  icons: {
    icon: "/butterfly-scarf-removebg-preview.png",
    shortcut: "/butterfly-scarf-removebg-preview.png",
    apple: "/butterfly-scarf-removebg-preview.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
