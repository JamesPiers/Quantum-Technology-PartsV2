'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [supplierId, setSupplierId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0])
      }
    },
  })

  const handleUpload = async () => {
    if (!selectedFile || !supplierId) {
      toast({
        title: 'Error',
        description: 'Please select a file and enter a supplier ID',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      // Step 1: Get signed upload URL
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          supplierId,
        }),
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, documentId, filePath } = await uploadResponse.json()

      // Step 2: Upload file to Supabase Storage
      const uploadFileResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      })

      if (!uploadFileResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Step 3: Trigger extraction
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          provider: 'mock', // Use mock provider by default for testing
        }),
      })

      if (!extractResponse.ok) {
        throw new Error('Failed to start extraction')
      }

      const { extractionId } = await extractResponse.json()

      toast({
        title: 'Success',
        description: 'File uploaded and extraction started',
      })

      // Redirect to review page
      router.push(`/review/${extractionId}`)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Supplier Quote</CardTitle>
            <CardDescription>
              Upload a PDF supplier quote to automatically extract parts and pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier ID</Label>
              <Input
                id="supplierId"
                placeholder="Enter supplier UUID"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">
                For testing, you can use any valid UUID format
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary'
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="h-12 w-12 text-primary" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">
                    {isDragActive
                      ? 'Drop the PDF here'
                      : 'Drag & drop a PDF here, or click to select'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Only PDF files are supported
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !supplierId || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading and extracting...
                </>
              ) : (
                'Upload and Extract'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

