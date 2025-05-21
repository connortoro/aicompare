import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] });


export const metadata: Metadata = {
  title: "aicompare",
  description: "compare ais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased bg-neutral-800 h-[100%]`} >
        <div className="flex flex-row h-full bg-neutral-900">
          <Sidebar/>
          {children}
        </div>

      </body>
    </html>
  );
}
