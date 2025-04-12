import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { Toaster } from "@/components/toaster"
import { initDatabase, migrateDatabase } from "@/lib/db"
import DbStatus from "@/components/db-status"

const inter = Inter({ subsets: ["latin"] })

// Initialize and migrate database on application startup
async function initializeDatabaseWithMigrations() {
  try {
    // First initialize database (create tables if they don't exist)
    const initialized = await initDatabase();
    if (!initialized) {
      console.error("Failed to initialize database tables");
      return;
    }
    
    // Then run migrations to add any missing columns
    const migrated = await migrateDatabase();
    if (!migrated) {
      console.error("Failed to migrate database schema");
      return;
    }
    
    console.log("Database initialization and migration completed successfully");
  } catch (error) {
    console.error("Error during database initialization:", error);
  }
}

// Call initialization function
initializeDatabaseWithMigrations().catch(console.error);

export const metadata = {
  title: "BerberBook - Randevu Sistemi",
  description: "Modern berber randevu ve yönetim sistemi",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar - mobile'da pozisyonu absolute */}
            <Sidebar />
            
            {/* Main content - tüm genişliği kaplar */}
            <div className="flex flex-col flex-1 overflow-hidden md:ml-72">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">{children}</div>
                <div className="fixed bottom-2 right-2 z-50">
                  <DbStatus />
                </div>
              </main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

import './globals.css'