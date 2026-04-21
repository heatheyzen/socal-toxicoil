import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'ACP5 Oil Spill Dashboard',
  description: 'Interactive map of offshore oil infrastructure, air quality, and environmental justice resources across California Coastal Planning Area 5.',
  keywords: ['oil spill', 'ACP 5', 'PM 2.5', 'CalEnviroScreen', 'environmental justice', 'Southern California'],
  openGraph: {
    title: 'ACP5 Oil Spill Dashboard',
    description: 'Mapping offshore oil infrastructure and health impacts in Los Angeles and Orange County.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
