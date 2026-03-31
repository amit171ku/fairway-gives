import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FairwayGives — Golf. Draw. Give.',
  description: 'Subscribe, enter your golf scores, win prizes, and support a charity you believe in.',
  openGraph: {
    title: 'FairwayGives',
    description: 'Golf. Draw. Give.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="bg-mist font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
