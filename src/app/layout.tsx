import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Planes",
  title: "Planes",
  description: "Минималистичный планер",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Planes",
  },
  icons: {
    icon: [
      {
        url: "/planes-favicon-32x32-20260618.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/planes-icon-192-20260618.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/planes-icon-512-20260618.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/planes-apple-touch-icon-20260618.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b3425",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="ru">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
