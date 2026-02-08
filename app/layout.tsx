import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/components/providers/query-provider'
import packageJson from '@/package.json'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quantum Technology - Supplier Quote Management',
  description: 'Manage supplier quotes, parts, and orders with AI-powered extraction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <nav className="border-b tie-dye-blue">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Quantum Technology</h1>
                  <div className="flex space-x-4">
                    <a href="/upload" className="text-white hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-medium">Upload</a>
                    <a href="/parts" className="text-white hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-medium">Parts</a>
                    <a href="/manufacturers" className="text-white hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-medium">Manufacturers</a>
                    {/* Orders menu hidden for now – remove 'hidden' to reactivate */}
                    <a href="/orders" className="hidden text-white hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-medium">Orders</a>
                  </div>
                </div>
              </div>
            </nav>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-4 mt-8">
              <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-gray-400">v{packageJson.version}</p>
              </div>
            </footer>
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}

