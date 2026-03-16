import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppMetadata } from './metadata';
import { Providers } from './providers';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AccentThemeProvider } from '@/contexts/accent-theme-context';
import { Poppins } from 'next/font/google';

const fontSans = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});


// We are defining the metadata object in a separate file
// and we are importing it here. Next.js was complaining about
// where the metadata object is not correctly applied to the page.
// We will remove this once the bug is fixed.
export const metadata = AppMetadata;
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="google-site-verification" content="wdOON2yavcg3beYQ-NO04Q1HjdA_qgRyZygGUyn4Sxk" />
        <link rel="icon" href="/new-logo/logo-favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2E7D32" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/new-logo/logo-favicon.png" />
      </head>
      <body className={cn("font-body antialiased", fontSans.variable)}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
