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
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          * { font-family: 'Sarabun', sans-serif !important; }
          input, select, textarea {
            color: #0f172a !important;
            background-color: #ffffff !important;
            font-weight: 600 !important;
            border-color: #cbd5e1 !important;
          }
          input::placeholder, textarea::placeholder {
            color: #64748b !important;
            font-weight: 400 !important;
          }
          select option {
            color: #0f172a !important;
            background-color: #ffffff !important;
            font-weight: 600 !important;
          }
        `}</style>
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
