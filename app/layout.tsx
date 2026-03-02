import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });
const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['700', '800']
});


export const metadata: Metadata = {
  title: "torochat",
  description: "chat with ais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} ${syne.variable} antialiased bg-neutral-800 h-[100%]`}
      >
        <div className="absolute inset-0 bg-red-500 opacity-[.009] pointer-events-none z-50"></div>
        {children}
      </body>
    </html>
  );
}
