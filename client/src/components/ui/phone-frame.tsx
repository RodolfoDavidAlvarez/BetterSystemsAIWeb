interface PhoneFrameProps {
  imageUrl: string;
  altText: string;
  title?: string;
  description?: string;
  rotate?: number;
  width?: number;
  shadow?: boolean;
}

export function PhoneFrame({
  imageUrl,
  altText,
  title,
  description,
  rotate = 0,
  width = 280,
  shadow = true
}: PhoneFrameProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        style={{ 
          transform: rotate ? `rotate(${rotate}deg)` : 'none',
          width: `${width}px`,
          maxWidth: '100%',
          zIndex: rotate ? 20 : 10,
        }}
        className={`relative ${shadow ? 'shadow-xl' : ''}`}
      >
        <div className="w-full border-[14px] border-[#1e3a4a] rounded-[40px] overflow-hidden bg-[#1e3a4a]">
          {/* Top notch */}
          <div className="h-6 w-24 bg-black mx-auto rounded-b-2xl mb-2" />
          
          {/* Screen content */}
          <div className="rounded-[25px] overflow-hidden bg-white">
            <img 
              src={imageUrl} 
              alt={altText}
              className="w-full h-auto"
              loading="eager"
            />
          </div>
          
          {/* Bottom home indicator */}
          <div className="h-1 w-1/3 bg-white/30 mx-auto rounded-full my-3" />
        </div>
      </div>
      
      {(title || description) && (
        <div className="mt-4 text-center max-w-xs">
          {title && <p className="font-medium text-sm">{title}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
    </div>
  );
}