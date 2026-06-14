import type { Metadata } from 'next';
import EnvironmentBadge from './_components/EnvironmentBadge';
import './globals.css';

export const metadata: Metadata = {
  title: 'RitimApp - NFC habit, fitness and wellness tracking',
  description: 'RitimApp helps people and sports centers track fitness, wellness, reading and habits with NFC cards.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EnvironmentBadge />
        {children}
      </body>
    </html>
  );
}
