import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NavTabs } from './components/NavTabs';
import { ThemeProvider } from './components/theme-provider';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FPL Multi-Tool',
  description: 'Comprehensive Fantasy Premier League analysis tools for classic leagues',
  keywords: [
    'Fantasy Premier League',
    'FPL',
    'analysis',
    'statistics',
    'tools',
    'league',
    'captain',
    'transfers',
    'effective ownership',
  ],
  authors: [{ name: 'FPL Multi-Tool' }],
  creator: 'FPL Multi-Tool',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fpl-multi-tool.vercel.app',
    title: 'FPL Multi-Tool',
    description: 'Comprehensive Fantasy Premier League analysis tools for classic leagues',
    siteName: 'FPL Multi-Tool',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FPL Multi-Tool',
    description: 'Comprehensive Fantasy Premier League analysis tools for classic leagues',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
            <NavTabs />
            <main className="container mx-auto px-4 py-8 flex-1">
              {children}
            </main>
            <footer className="border-t bg-muted/30 mt-auto">
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>© 2025 FPL Multi-Tool</span>
                    <span>•</span>
                    <span>Unofficial FPL Analysis Tool</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <a 
                      href="https://github.com/raf2602/fpl-multi-tool" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      GitHub
                    </a>
                    <span>•</span>
                    <a 
                      href="https://fantasy.premierleague.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      Official FPL
                    </a>
                    <span>•</span>
                    <span>Data from FPL API</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
