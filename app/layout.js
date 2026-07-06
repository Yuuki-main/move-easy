import { Inter } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata = {
  title: {
    default: "Moving Easy - Move Smarter, Move Easier",
    template: "%s | Moving Easy",
  },
  description:
    "Find trusted moving services, compare quotes, and book your move with ease. Moving Easy connects you with professional movers for a stress-free relocation experience.",
  keywords: [
    "moving services",
    "relocation",
    "movers",
    "moving company",
    "packing services",
    "local move",
    "long distance move",
  ],
  authors: [{ name: "Moving Easy" }],
  creator: "Moving Easy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moving-easy.com",
    siteName: "Moving Easy",
    title: "Moving Easy - Move Smarter, Move Easier",
    description:
      "Find trusted moving services, compare quotes, and book your move with ease.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Moving Easy - Move Smarter, Move Easier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moving Easy - Move Smarter, Move Easier",
    description:
      "Find trusted moving services, compare quotes, and book your move with ease.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
