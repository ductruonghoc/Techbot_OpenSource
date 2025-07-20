
import type { Metadata } from 'next'
//Contexts
import './globals.css'

export const metadata: Metadata = {
  title: 'Techbot',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  description: 'Techbot help you know deeper about your device manuals',
  generator: 'Techbot HCMUS & Mentor Ngô Ngọc Đăng Khoa',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* <head>
        <link rel="icon" href="/image.ico" sizes="any" type='image/x-icon'/>
      </head> */}
      <body>
        {children}
      </body>
    </html>
  )
}
