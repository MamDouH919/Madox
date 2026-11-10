import type { Metadata, Viewport } from "next";
import { Cairo, Lalezar } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "700", "800", "900"],
});

const lalezar = Lalezar({
  variable: "--font-lalezar",
  subsets: ["arabic", "latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "هنطبخ إيه النهارده؟ 🍗",
  description: "استبيان رسمي وسريع لتحديد أكل النهارده. جاوبي وشوفي النتيجة!",
  openGraph: {
    title: "هنطبخ إيه النهارده؟ 🍗",
    description: "استبيان رسمي وسريع لتحديد أكل النهارده. جاوبي وشوفي النتيجة!",
    locale: "ar_EG",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b0d6b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${lalezar.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
