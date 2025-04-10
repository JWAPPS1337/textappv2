import type { Metadata } from 'next';
import './globals.css';
import '98.css';

export const metadata: Metadata = {
  title: 'Stapler',
  description: 'A document conversion and PDF processing application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ 
        backgroundColor: '#008080', 
        fontFamily: 'Arial', 
        padding: '20px',
        margin: 0,
        height: '100vh',
        width: '100vw',
        overflow: 'auto'
      }}>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  );
} 