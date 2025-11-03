import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Supplier Quote Management System
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered extraction and management of supplier quotes, parts, and orders
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Quotes</CardTitle>
              <CardDescription>
                Upload supplier quote PDFs and extract data automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/upload">
                <Button className="w-full">Go to Upload</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Parts</CardTitle>
              <CardDescription>
                View and manage your parts catalog with pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/parts">
                <Button className="w-full">View Parts</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Orders</CardTitle>
              <CardDescription>
                Create and manage customer quotes and purchase orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/orders">
                <Button className="w-full">View Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>AI-powered extraction from PDF supplier quotes using OpenAI or Google Document AI</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Manual review and approval workflow for extracted data</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Automatic parts catalog and pricing management</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Create customer quotes with automatic price selection</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Secure file storage with Supabase</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

