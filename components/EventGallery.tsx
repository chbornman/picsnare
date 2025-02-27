"use client"

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react"
import Image from "next/image"
import Masonry from "react-masonry-css"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { supabase } from "@/utils/supabase"

interface ImageItem {
  src: string
  alt: string
  createdAt: string
}

export interface EventGalleryRefType {
  refreshPhotos: () => Promise<void>
}

const breakpointColumnsObj = {
  default: 3,
  1100: 3,
  700: 2,
  500: 1,
}

const EventGallery = forwardRef<EventGalleryRefType, { eventId: string, id?: string }>(
  function EventGallery({ eventId, id }, ref) {
    const [photos, setPhotos] = useState<ImageItem[]>([])
    const [selectedPhoto, setSelectedPhoto] = useState<ImageItem | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
    const componentRef = useRef<HTMLElement>(null)
    const loadingTimerRef = useRef<NodeJS.Timeout | null>(null)

    const fetchPhotos = useCallback(async () => {
      if (isLoading) return
      
      setIsLoading(true)
      
      // Only show loading indicator if it takes more than 300ms
      loadingTimerRef.current = setTimeout(() => {
        setShowLoadingIndicator(true)
      }, 300)
      
      try {
        const { data, error } = await supabase.storage.from("event-photos").list(eventId, {
          sortBy: { column: "created_at", order: "desc" },
        })

        if (error) throw error

        // Process in smaller batches to avoid overwhelming the browser
        const photoUrls: ImageItem[] = [];
        
        // Process images in batches of 10
        for (let i = 0; i < data.length; i += 10) {
          const batch = data.slice(i, i + 10);
          const batchUrls = await Promise.all(
            batch.map(async (item) => {
              const { data: urlData } = await supabase.storage.from("event-photos").getPublicUrl(`${eventId}/${item.name}`)
              return {
                src: urlData.publicUrl,
                alt: `Event photo ${item.name}`,
                createdAt: item.created_at,
              }
            })
          );
          
          photoUrls.push(...batchUrls);
          
          // If this isn't the first batch, briefly yield to let the UI render
          if (i > 0 && photoUrls.length > 0) {
            setPhotos([...photoUrls]);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        setPhotos(photoUrls)
      } catch (err) {
        console.error("Error fetching photos:", err)
      } finally {
        // Clear the timeout and reset loading states
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current)
        }
        setIsLoading(false)
        setShowLoadingIndicator(false)
      }
    }, [eventId, isLoading])

    // Expose the refreshPhotos method to parent components
    useImperativeHandle(ref, () => ({
      refreshPhotos: fetchPhotos
    }))

    // Expose the refreshPhotos method via DOM for legacy access
    useEffect(() => {
      if (componentRef.current) {
        // Using type assertion with specific function type instead of any
        (componentRef.current as unknown as { refreshPhotos: typeof fetchPhotos }).refreshPhotos = fetchPhotos
      }
    }, [fetchPhotos])

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
        }
      };
    }, []);

    useEffect(() => {
      fetchPhotos()
    }, [fetchPhotos])

    const handleImageClick = (photo: ImageItem) => {
      setSelectedPhoto(photo)
    }

  return (
    <section className="mt-4" ref={componentRef} id={id}>
      <h2 className="text-2xl font-semibold mb-4">
        Event Photos
        {showLoadingIndicator && <span className="text-sm ml-2 text-muted-foreground">(loading...)</span>}
      </h2>
      {photos.length === 0 && !showLoadingIndicator ? (
        <p>No photos uploaded yet.</p>
      ) : (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {photos.map((photo) => (
            <div 
              key={photo.src} 
              onClick={() => handleImageClick(photo)} 
              className="cursor-pointer mb-4"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={500}
                height={350}
                className="rounded-md w-full h-auto object-cover transition-opacity duration-300"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PC9zdmc+"
                loading="lazy"
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
              width={1200}
              height={800}
              className="w-full h-auto object-contain max-h-[80vh]"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PC9zdmc+"
              priority={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
})

export default EventGallery;

