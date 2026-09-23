import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { StoreProvider } from '@/components/providers/StoreProvider';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'PteasYeung — Room Management',
  description: 'Manage properties, rooms, and bookings with ease.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <StoreProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" toastOptions={{
                className: 'dark:bg-slate-800 dark:text-white',
              }} />
            </AuthProvider>
          </LanguageProvider>
        </StoreProvider>
      </body>
    </html>
  );
}