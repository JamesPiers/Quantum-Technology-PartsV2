'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Loader2, Brain, TestTube, Clock, ArrowRight, FileWarning, Trash2 } from 'lucide-react'

type ProviderType = 'mock' | 'openai'

interface SavedDraft {
  id: string
  status: string
  created_at: string
  normalized_json: any
  accuracy: any
  documents: {
    file_path: string
    doc_type: string
    status: string
    created_at: string
  }[]
}

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('openai')
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDrafts() {
      try {
        const res = await fetch('/api/extractions?status=draft,pending_review')
        if (res.ok) {
          const json = await res.json()
          setSavedDrafts(json.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch saved drafts:', err)
      } finally {
        setIsLoadingDrafts(false)
      }
    }
    fetchDrafts()
  }, [])

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Delete this draft? This cannot be undone.')) return
    setDeletingId(draftId)
    try {
      const res = await fetch(`/api/extractions/${draftId}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedDrafts((prev) => prev.filter((d) => d.id !== draftId))
        toast({ title: 'Draft deleted' })
      } else {
        toast({ title: 'Error', description: 'Failed to delete draft', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete draft', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

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

        // Provide user-friendly message for configuration errors
        if (extractResponse.status === 503 || (errorData.message && errorData.message.includes('API key'))) {
          throw new Error('OpenAI API key is not configured. Please add a valid OPENAI_API_KEY to your .env.local file and restart the server. Alternatively, use the "Mock Data" provider for testing.')
        }

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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedProvider === 'mock' && '⚡ Returns sample data instantly for testing'}
                {selectedProvider === 'openai' && '🧠 Uses GPT-4o Mini for intelligent extraction (Recommended for supplier quotes)'}
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

        {/* Saved Drafts Section */}
        {!isLoadingDrafts && savedDrafts.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Saved Drafts
              </CardTitle>
              <CardDescription>
                Resume reviewing previously uploaded quotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedDrafts.map((draft) => {
                  const draftName = draft.accuracy?.draft_name || 'Unnamed Draft'
                  const savedAt = draft.accuracy?.saved_at
                    ? new Date(draft.accuracy.saved_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : new Date(draft.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                  const lineItemCount = draft.normalized_json?.line_items?.length || 0
                  const supplierName = draft.normalized_json?.supplier_name || 'Unknown Supplier'
                  const fileName = draft.documents?.[0]?.file_path?.split('/').pop() || 'Unknown file'

                  return (
                    <div
                      key={draft.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <FileWarning className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{draftName}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {supplierName} &middot; {lineItemCount} line item{lineItemCount !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fileName} &middot; Saved {savedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/review/${draft.id}`)}
                        >
                          Resume
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft.id)}
                          disabled={deletingId === draft.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          {deletingId === draft.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoadingDrafts && (
          <div className="mt-6 flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading saved drafts...</span>
          </div>
        )}
      </div>
    </div>
  )
}

