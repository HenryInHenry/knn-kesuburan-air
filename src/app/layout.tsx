import Navbar from '@/components/navbar'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import styles from './layout.module.css'
import moment from 'moment'
import 'moment/locale/id'
moment.locale('id')

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'KNN Kesuburan Air',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '',
  manifest: '/manifest.json',
  authors: [{ name: 'Hafidz Ubaidillah', url: 'https://hafidzubaidillah.com' }],
  robots: 'index, follow',
  icons: [
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png'
  ],
}

export const viewport: Viewport = {
  themeColor: '#5663f5'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        
        <Navbar />
        <main className={styles.main}>
          {children}
        </main>
        
      </body>
    </html>
  )
}
