"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/utils/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Upload } from "lucide-react"

export default function EventUploader({
  eventId,
  onUploadSuccess,
}: {
  eventId: string
  onUploadSuccess: (newPhotoUrls: string[]) => void
}) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

  const handleUpload = async () => {
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${eventId}/${fileName}`

        const { error } = await supabase.storage.from("event-photos").upload(filePath, file)

        if (error) throw error

        const { data: urlData } = supabase.storage.from("event-photos").getPublicUrl(filePath)
        uploadedUrls.push(urlData.publicUrl)
      }

      console.log("Files uploaded successfully:", uploadedUrls)
      toast({
        title: "Success",
        description: `${files.length} photo${files.length > 1 ? "s" : ""} uploaded successfully!`,
      })
      onUploadSuccess(uploadedUrls)
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Error",
        description: `Failed to upload photos: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setFiles(null)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Upload Photos</CardTitle>
      </CardHeader>
      <CardContent>
        <Input type="file" accept="image/*" multiple onChange={handleFileChange} className="mb-4" />
        <Button onClick={handleUpload} disabled={!files || uploading} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : `Upload Photo${files && files.length > 1 ? "s" : ""}`}
        </Button>
      </CardContent>
    </Card>
  )
}

