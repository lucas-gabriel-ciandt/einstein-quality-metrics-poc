import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Métricas de qualidade — Portal Einstein',
  description:
    'DRE, CFR, MTTR e False Alarm das entregas do front-end do time de pacientes.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
