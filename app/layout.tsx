'use client'

import { useState, useEffect } from "react";
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth"
import { Dot, DotIcon } from "lucide-react";

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const [serverMessage, setServerMessage] = useState<{ message: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status`);
        console.log(res);
        const data = await res.json();
        setServerMessage(data);
      } catch (err) {
        console.error("API fetch failed:", err);
      }
    };

    fetchData(); // Initial fetch

    const interval = setInterval(fetchData, 20000); // every 20 sec

    return () => clearInterval(interval); // cleanup
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
            {serverMessage && (
                <DotIcon className="w-10 h-10 fixed top-1 left-1" color="green" />
            )}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
