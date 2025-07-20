"use client"
import { ConversationsProvider } from "@/context/conversation"

export default function Layout({
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
        <ConversationsProvider>
          {children}
        </ConversationsProvider>
      </body>
    </html>
  )
}