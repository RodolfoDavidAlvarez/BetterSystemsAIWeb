// No need to import React in newer React versions

interface ImagePhoneFrameProps {
  imageUrl: string;
  altText: string;
  captionText?: string;
  rotate?: number;
  frameColor?: string;
  width?: number;
  scale?: number;
}

export function ImagePhoneFrame({
  imageUrl,
  altText,
  captionText,
  rotate = 0,
  frameColor = "#1e3a4a",
  width = 280,
  scale = 1
}: ImagePhoneFrameProps) {
  const scaledWidth = width * scale;
  
  return (
    <div className="relative">
      <div 
        style={{ 
          transform: rotate ? `rotate(${rotate}deg)` : 'none',
          width: `${scaledWidth}px`,
        }}
        className="relative z-10"
      >
        <div 
          style={{ borderColor: frameColor }}
          className="border-[14px] rounded-[40px] shadow-xl overflow-hidden"
        >
          <div className="w-full overflow-hidden bg-white rounded-[25px]">
            <img 
              src={imageUrl} 
              alt={altText} 
              className="w-full h-auto"
            />
          </div>
        </div>
        {captionText && (
          <div className="mt-3 text-center">
            <p className="text-sm text-muted-foreground">{captionText}</p>
          </div>
        )}
      </div>
    </div>
  );
}