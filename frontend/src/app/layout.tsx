"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Github, Trophy } from "lucide-react";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar isCollapsed={isSidebarCollapsed} />
            <div className="flex-1 flex flex-col">
              <Header 
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
              <main className="flex-1 bg-background">
                <div className="container mx-auto p-6">
                  {children}
                </div>
              </main>
              <footer className="border-t py-6 bg-background">
                <div className="container mx-auto px-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">
                        Football Tournament Manager
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                      <a 
                        href="/docs" 
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Dokümantasyon
                      </a>
                      <a 
                        href="/privacy" 
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Gizlilik
                      </a>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      © {new Date().getFullYear()} Football Tournament Manager. Tüm hakları saklıdır.
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
