import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบจองห้องประชุม ศูนย์ราชการจังหวัดกำแพงเพชร",
  description: "ระบบบริการจองห้องประชุมออนไลน์ ศูนย์ราชการจังหวัดกำแพงเพชร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
