import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})


export const metadata: Metadata = {
  title: 'heyMed!',
  description: 'Entrena tu diagnóstico clínico con claridad.',
  icons: {
    icon: '/icon.ico',
    shortcut: '/icons/favicon-32x32.png',
    apple: '/icons/favicon-180x180.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Inline script prevents FOUC when switching themes */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('heymed_theme')||'light';document.documentElement.classList.add(t);})()` }} />
      </head>
      <body className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
