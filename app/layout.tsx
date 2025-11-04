import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/components/providers/query-provider'

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
            <nav className="border-b">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Quantum Technology</h1>
                  <div className="flex space-x-4">
                    <a href="/upload" className="hover:underline">Upload</a>
                    <a href="/parts" className="hover:underline">Parts</a>
                    <a href="/orders" className="hover:underline">Orders</a>
                  </div>
                </div>
              </div>
            </nav>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-4 mt-8">
              <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-gray-400">v1.3.1</p>
              </div>
            </footer>
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}

