import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})


export const metadata: Metadata = {
  title: {
    default: 'heyMed! — Entrena tu razonamiento clínico con IA',
    template: '%s | heyMed!'
  },
  description: ' heyMed! es una plataforma de educación médica potenciada por inteligencia artificial. Entrena tu diagnóstico clínico con casos reales, razonamiento libre y evaluación semántica sin alternativas.',
  keywords: ['casos clínicos', 'medicina', 'simulación médica', 'diagnóstico médico', 'inteligencia artificial en medicina', 'estudio médico', 'USMLE', 'MIR', 'ENARM'],
  authors: [{ name: 'manudev' }],
  creator: 'manudev',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://heymed.app',
    title: 'heyMed! — Entrena tu razonamiento clínico con IA',
    description: 'Entrena tu diagnóstico clínico mediante casos médicos de cardiología, neurología, etc. Evaluado instantáneamente por IA.',
    siteName: 'heyMed!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'heyMed! — Inteligencia Artificial para el Razonamiento Médico',
    description: 'Entrena tu diagnóstico clínico con IA. Sin preguntas múltiples. Escribe tu diagnóstico y recibe retroalimentación experta al instante.',
  },
  icons: {
    icon: '/favicon.ico',
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

// Global JSON-LD schema for AI search engines (GEO)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'heyMed!',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'COP',
      },
      description: 'heyMed! evalúa diagnósticos médicos en lenguaje natural, usando IA para mejorar el razonamiento clínico sin opciones múltiples.',
    },
    {
      '@type': 'Organization',
      name: 'heyMed!',
      url: 'https://heymed.app',
      logo: 'https://heymed.app/icon.png',
      founder: {
        '@type': 'Person',
        name: 'manudev',
      }
    }
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
