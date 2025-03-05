import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ExpandableImage({ 
  src, 
  alt, 
  className, 
  containerClassName 
}: ExpandableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className={cn(
          "relative cursor-pointer overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg", 
          containerClassName
        )}
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={src} 
          alt={alt} 
          className={cn("w-full object-cover", className)} 
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity hover:opacity-100 flex items-center justify-center">
          <div className="bg-black/60 text-white text-sm font-medium px-3 py-1 rounded-full">
            Click to expand
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] w-auto max-h-[90vh] p-0 border-none bg-transparent">
          <div className="relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 bg-black/70 p-1 rounded-full text-white hover:bg-black/90 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img 
              src={src} 
              alt={alt} 
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}