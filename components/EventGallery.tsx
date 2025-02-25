"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Masonry from "react-masonry-css"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { supabase } from "@/utils/supabase"

interface ImageItem {
  src: string
  alt: string
  createdAt: string
}

const breakpointColumnsObj = {
  default: 3,
  1100: 3,
  700: 2,
  500: 1,
}

export default function EventGallery({ eventId }: { eventId: string }) {
  const [photos, setPhotos] = useState<ImageItem[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<ImageItem | null>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage.from("event-photos").list(eventId, {
        sortBy: { column: "created_at", order: "desc" },
      })

      if (error) throw error

      const photoUrls = await Promise.all(
        data.map(async (item) => {
          const { data: urlData } = await supabase.storage.from("event-photos").getPublicUrl(`${eventId}/${item.name}`)
          return {
            src: urlData.publicUrl,
            alt: `Event photo ${item.name}`,
            createdAt: item.created_at,
          }
        }),
      )

      setPhotos(photoUrls)
    } catch (err) {
      console.error("Error fetching photos:", err)
    }
  }, [eventId])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleImageClick = (photo: ImageItem) => {
    setSelectedPhoto(photo)
  }

  return (
    <section className="mt-4">
      <h2 className="text-2xl font-semibold mb-4">Event Photos</h2>
      {photos.length === 0 ? (
        <p>No photos uploaded yet.</p>
      ) : (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {photos.map((photo, index) => (
            <div key={index} onClick={() => handleImageClick(photo)} className="cursor-pointer mb-4">
              <Image
                src={photo.src || "/placeholder.svg"}
                alt={photo.alt}
                width={500}
                height={500}
                className="rounded-md object-cover w-full"
              />
            </div>
          ))}
        </Masonry>
      )}

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-0">
          {selectedPhoto && (
            <Image
              src={selectedPhoto.src || "/placeholder.svg"}
              alt={selectedPhoto.alt}
              width={1000}
              height={1000}
              className="w-full h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

