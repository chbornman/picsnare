"use client"

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react"
import Image from "next/image"
import Masonry from "react-masonry-css"
import { supabase } from "@/utils/supabase"
import Lightbox from "yet-another-react-lightbox"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Slideshow from "yet-another-react-lightbox/plugins/slideshow"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Counter from "yet-another-react-lightbox/plugins/counter"
import Captions from "yet-another-react-lightbox/plugins/captions"
import Download from "yet-another-react-lightbox/plugins/download"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import "yet-another-react-lightbox/plugins/counter.css"
import "yet-another-react-lightbox/plugins/captions.css"

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

    // State for the lightbox
  const [lightboxState, setLightboxState] = useState({
    open: false,
    index: 0
  });

  const handleImageClick = (photoIndex: number) => {
    // Update both values together in a single state update
    setLightboxState({
      open: true,
      index: photoIndex
    });
  }
  
  const handleLightboxClose = () => {
    setLightboxState(prev => ({
      ...prev,
      open: false
    }));
  }
  
  // Handle slide change within the lightbox
  const handleSlideChange = (newIndex: number) => {
    setLightboxState(prev => ({
      ...prev,
      index: newIndex
    }));
  }

  // Convert our photos to the format expected by the lightbox
  const lightboxSlides = photos.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    width: 1920, // Provide dimensions to help the lightbox
    height: 1080,
    title: photo.alt,
    description: new Date(photo.createdAt).toLocaleDateString(),
  }));

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
          {photos.map((photo, index) => (
            <div 
              key={photo.src} 
              onClick={() => handleImageClick(index)} 
              className="cursor-pointer mb-4 overflow-hidden rounded-md group"
            >
              <div className="relative rounded-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={500}
                  height={350}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PC9zdmc+"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </Masonry>
      )}

      {/* Lightbox for fullscreen gallery */}
      <Lightbox
        open={lightboxState.open}
        close={handleLightboxClose}
        slides={lightboxSlides}
        index={lightboxState.index}
        on={{
          view: ({ index }) => handleSlideChange(index),
          change: ({ index }) => handleSlideChange(index)
        }}
        plugins={[Fullscreen, Slideshow, Thumbnails, Zoom, Counter, Captions, Download]}
        carousel={{
          finite: true,
          preload: 3, // Preload 3 images ahead
          imageFit: "contain",
        }}
        render={{
          buttonPrev: slides => slides.length > 1 ? undefined : () => null,
          buttonNext: slides => slides.length > 1 ? undefined : () => null,
        }}
        controller={{
          touchAction: "pan-y",
        }}
        thumbnails={{
          position: 'bottom',
          width: 120,
          height: 80,
          gap: 16, 
          border: 0,
          borderRadius: 4,
          padding: 4,
        }}
        styles={{ 
          container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
          thumbnail: { opacity: 0.8 },
          thumbnailsTrack: { padding: "12px 0" },
        }}
        captions={{
          showToggle: true,
          descriptionTextAlign: "center",
        }}
        animation={{ swipe: 250 }}
        render={{ 
          iconSlideshowPlay: () => null,
          iconSlideshowPause: () => null,
        }}
        counter={{
          container: { style: { top: '12px', left: '12px', fontSize: '14px' } }
        }}
      />
    </section>
  )
})

export default EventGallery;

