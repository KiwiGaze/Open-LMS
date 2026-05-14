import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers.tsx';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Open-LMS',
    template: '%s — Open-LMS',
  },
  description: 'A modern learning management system for institutions.',
  applicationName: 'Open-LMS',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0d14' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply persisted theme before paint to prevent flash. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted inline init
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('openlms.theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
