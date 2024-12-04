import { useState, useEffect } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
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
  return (
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
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <img
                src={image.src}
                alt={image.alt}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold">{image.title}</h3>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
