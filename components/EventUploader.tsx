"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/utils/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, ImageIcon, CheckCircle2, AlertCircle } from "lucide-react"
import Image from "next/image"

interface UploadFileInfo {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  url?: string;
  error?: string;
}

export default function EventUploader({
  eventId,
  onUploadSuccess,
}: {
  eventId: string
  onUploadSuccess: (newPhotoUrls: string[]) => void
}) {
  const [uploadFiles, setUploadFiles] = useState<UploadFileInfo[]>([])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const createPreview = useCallback((file: File): string => {
    return URL.createObjectURL(file)
  }, [])

  // 10MB in bytes (Supabase default file size limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const validFiles: File[] = []
    const invalidFiles: {file: File, reason: string}[] = []

    // Validate files
    Array.from(e.target.files).forEach(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({
          file, 
          reason: `File exceeds 10MB size limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
        })
      } else {
        validFiles.push(file)
      }
    })

    // Show warnings for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({file, reason}) => {
        toast({
          title: "File rejected",
          description: `${file.name}: ${reason}`,
          variant: "destructive"
        })
      })
    }

    // Process valid files
    const newFiles: UploadFileInfo[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 15),
      file,
      preview: createPreview(file),
      progress: 0,
      status: 'pending'
    }))

    // Add files to state
    setUploadFiles(prev => [...prev, ...newFiles])
    
    // Reset the input to allow selecting the same files again
    e.target.value = ''
    
    // Automatically start uploading the new files
    if (newFiles.length > 0 && !uploading) {
      await processUpload(newFiles);
    }
  }

  const removeFile = (id: string) => {
    setUploadFiles(prev => {
      const updated = prev.filter(file => file.id !== id)
      // Revoke object URL to avoid memory leaks
      const fileToRemove = prev.find(file => file.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updated
    })
  }

  // Function to compress image file
  const compressImage = async (file: File, maxSize: number = MAX_FILE_SIZE): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // If file is already under limit, don't compress
      if (file.size <= maxSize) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = document.createElement('img') as HTMLImageElement;
        img.src = event.target?.result as string;
        
        img.onload = () => {
          // Calculate compression quality (lower for larger files)
          let quality = 0.7;
          if (file.size > 5 * 1024 * 1024) {
            quality = 0.5;
          }
          
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // If image is very large, reduce dimensions
          const MAX_DIMENSION = 2000; // Max width/height
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const aspectRatio = width / height;
            if (width > height) {
              width = MAX_DIMENSION;
              height = width / aspectRatio;
            } else {
              height = MAX_DIMENSION;
              width = height * aspectRatio;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Compression failed, return null
                resolve(null);
                return;
              }
              console.log(`Compressed from ${file.size} to ${blob.size} bytes`);
              resolve(blob);
            },
            file.type,
            quality
          );
        };
      };
    });
  };

  const uploadFile = async (fileInfo: UploadFileInfo): Promise<UploadFileInfo> => {
    const fileExt = fileInfo.file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${eventId}/${fileName}`

    let updatedFileInfo = { ...fileInfo, status: 'uploading' as const }

    try {
      // Try compressing the image if it's large
      let fileToUpload: File | Blob = fileInfo.file;
      
      // Update status to show compression is happening
      setUploadFiles(prev => 
        prev.map(f => f.id === fileInfo.id ? { ...updatedFileInfo, progress: 1 } : f)
      );

      // Compress large images to avoid payload too large errors
      if (fileInfo.file.size > 2 * 1024 * 1024) { // > 2MB
        const compressedBlob = await compressImage(fileInfo.file);
        if (compressedBlob) {
          fileToUpload = compressedBlob;
        }
      }

      // Upload the file without progress tracking
      const { error: uploadError } = await supabase.storage
        .from("event-photos")
        .upload(filePath, fileToUpload)
        
      // Set progress to 100% when upload completes
      updatedFileInfo = { ...updatedFileInfo, progress: 100 }
      setUploadFiles(prev => 
        prev.map(f => f.id === fileInfo.id ? updatedFileInfo : f)
      )

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("event-photos")
        .getPublicUrl(filePath)

      return {
        ...updatedFileInfo,
        status: 'complete',
        progress: 100,
        url: urlData.publicUrl
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      return {
        ...updatedFileInfo,
        status: 'error',
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  const processUpload = async (files: UploadFileInfo[]) => {
    if (files.length === 0 || uploading) return

    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setUploading(true)
    const completedFiles: UploadFileInfo[] = []

    try {
      // Upload files in parallel but limit concurrency to 3
      const batchSize = 3
      for (let i = 0; i < pendingFiles.length; i += batchSize) {
        const batch = pendingFiles.slice(i, i + batchSize)
        const results = await Promise.all(batch.map(file => uploadFile(file)))
        
        // Update all files with their new statuses
        setUploadFiles(prev => {
          return prev.map(f => {
            const updated = results.find(r => r.id === f.id)
            return updated || f
          })
        })
        
        // Keep track of successfully uploaded files
        const successful = results.filter(f => f.status === 'complete' && f.url)
        completedFiles.push(...successful)
      }

      // Get all the URLs from the completed files
      const uploadedUrls: string[] = completedFiles
        .map(f => f.url as string)
        .filter(Boolean)

      if (uploadedUrls.length > 0) {
        const totalCount = uploadedUrls.length;
        toast({
          title: "Success",
          description: `${totalCount} photo${totalCount > 1 ? 's' : ''} uploaded successfully!`,
        })
        // Call the callback function to refresh the gallery
        onUploadSuccess(uploadedUrls)
      }
    } catch (error) {
      console.error("Error in upload process:", error)
      toast({
        title: "Error",
        description: `Failed to upload photos: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const clearCompleted = () => {
    setUploadFiles(prev => {
      // Revoke object URLs for completed files
      prev.forEach(file => {
        if (file.status === 'complete') {
          URL.revokeObjectURL(file.preview)
        }
      })
      return prev.filter(file => file.status !== 'complete')
    })
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Upload Photos</CardTitle>
        <p className="text-sm text-muted-foreground">Maximum file size: 10MB per image</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative">
              <label 
                htmlFor="file-upload" 
                className="btn cursor-pointer flex items-center justify-center gap-2 px-4 py-2 w-full rounded-md border text-sm font-medium border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <Upload className="h-4 w-4" />
                <span>Select photos to upload</span>
              </label>
              <Input
                id="file-upload" 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
            
            {uploadFiles.some(f => f.status === 'complete') && (
              <Button 
                variant="outline"
                onClick={clearCompleted}
                className="ml-4"
              >
                Clear Completed
              </Button>
            )}
          </div>
          
          {uploadFiles.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3 max-h-80 overflow-y-auto">
              {uploadFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center space-x-3 p-2 border-b last:border-b-0"
                >
                  <div className="relative h-14 w-14 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                    {file.preview ? (
                      <Image
                        src={file.preview}
                        alt={file.file.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress 
                        value={file.progress} 
                        className="h-2 flex-1"
                        color={file.status === 'error' ? 'bg-red-500' : undefined}
                      />
                      <span className="text-xs w-9 text-right">
                        {file.status === 'error' ? 'Error' : `${file.progress}%`}
                      </span>
                    </div>
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {file.status === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : file.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : file.status === 'uploading' ? (
                      <span className="text-xs text-muted-foreground">Uploading...</span>
                    ) : (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="rounded-full p-1 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

