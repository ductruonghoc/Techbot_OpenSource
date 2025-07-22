"use client"
import { ConversationsProvider } from "@/context/conversation"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BASEURL from "@/src/app/api/backend/dmc_api_gateway/baseurl";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter();
      useEffect(() => {
      const checkAuthorization = async () => {
        const token = localStorage.getItem("dmc_api_gateway_token");
        if (!token) return;
        try {
          const response = await fetch(`${BASEURL}/auth/client_authorize`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            router.push("/client/features");
          }
        } catch (error) {
          // Ignore errors, stay on login page
        }
      };
      checkAuthorization();
    }, [router]);
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