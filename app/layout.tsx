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
        <style dangerouslySetInnerHTML={{ __html: `nav[data-app-header]{background-color:#1e3a8a!important}nav[data-app-header],nav[data-app-header] a,nav[data-app-header] h1{color:#f8fafc!important;text-shadow:none!important}nav[data-app-header] a:hover{color:#fff!important}` }} />
        <QueryProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <nav data-app-header className="border-b border-blue-800/50 shadow-sm" style={{ backgroundColor: '#1e3a8a', color: '#f8fafc' }}>
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f8fafc' }}>Quantum Technology</h1>
                  <div className="flex items-center gap-6">
                    <a href="/upload" className="font-medium transition-colors" style={{ color: '#f8fafc' }}>Upload</a>
                    <a href="/parts" className="font-medium transition-colors" style={{ color: '#f8fafc' }}>Parts</a>
                    <a href="/manufacturers" className="font-medium transition-colors" style={{ color: '#f8fafc' }}>Manufacturers</a>
                    {/* Orders menu hidden for now – remove 'hidden' to reactivate */}
                    <a href="/orders" className="hidden font-medium transition-colors" style={{ color: '#f8fafc' }}>Orders</a>
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

