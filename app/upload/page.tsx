'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Loader2, Brain, Cloud, TestTube } from 'lucide-react'

type ProviderType = 'mock' | 'openai' | 'docai' | 'docai-invoice'

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('openai')

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
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file',
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
          provider: selectedProvider,
        }),
      })

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json().catch(() => ({ error: 'Failed to start extraction' }))
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.message || errorData.error || 'Failed to start extraction'
        throw new Error(errorMessage)
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
              Upload a PDF supplier quote to automatically extract parts, pricing, and supplier information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-3">
              <Label className="text-base font-semibold">Extraction Provider</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('mock')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    selectedProvider === 'mock'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <TestTube className={`h-8 w-8 ${selectedProvider === 'mock' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className="font-medium">Mock Data</p>
                    <p className="text-xs text-muted-foreground">For testing</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('openai')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    selectedProvider === 'openai'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <Brain className={`h-8 w-8 ${selectedProvider === 'openai' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className="font-medium">OpenAI</p>
                    <p className="text-xs text-muted-foreground">GPT-4o Mini</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('docai')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    selectedProvider === 'docai'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <Cloud className={`h-8 w-8 ${selectedProvider === 'docai' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className="font-medium">Doc AI</p>
                    <p className="text-xs text-muted-foreground">General</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('docai-invoice')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    selectedProvider === 'docai-invoice'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <Cloud className={`h-8 w-8 ${selectedProvider === 'docai-invoice' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className="font-medium">Doc AI</p>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                  </div>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedProvider === 'mock' && '⚡ Returns sample data instantly for testing'}
                {selectedProvider === 'openai' && '🧠 Uses GPT-4o Mini for intelligent extraction (Recommended for supplier quotes)'}
                {selectedProvider === 'docai' && '☁️ Uses Google Document AI General Processor (Requires custom training for quotes)'}
                {selectedProvider === 'docai-invoice' && '📄 Uses Google Document AI Invoice Processor (For invoices only, not quotes)'}
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
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
            
            {isUploading && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                ⏱️ Large multi-page documents may take 1-3 minutes to process...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

