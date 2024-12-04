import { useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"

interface GalleryImage {
  src: string;
  title: string;
  alt: string;
}

interface ContinuousGalleryProps {
  images: GalleryImage[];
}

export function ContinuousGallery({ images }: ContinuousGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <>
      <Carousel
        opts={{
          align: "start",
          loop: true,
          skipSnaps: false,
          dragFree: true,
          containScroll: false,
          slidesToScroll: 1,
        }}
        plugins={[
          Autoplay({
            delay: 2000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
              <div 
                className="relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer group"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/80 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold transform transition-all duration-300 group-hover:text-primary group-hover:translate-y-[-4px]">{image.title}</h3>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl" aria-describedby="gallery-image-desc">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
            <p id="gallery-image-desc" className="text-sm text-muted-foreground">
              Click anywhere outside or use the close button to exit the image view
            </p>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute right-4 top-4 p-2 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-6 w-6" />
              </Button>
            </DialogClose>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-[4/3] w-full">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="object-contain w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
