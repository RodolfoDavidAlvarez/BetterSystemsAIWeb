import React, { useState, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { toast } from "../hooks/use-toast";

const PhotoSubmissionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please make sure you have granted permission.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
            setPreviewUrl(canvas.toDataURL('image/jpeg'));
          }
        }, 'image/jpeg');
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select or capture a photo first",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement file upload logic here
    toast({
      title: "Success",
      description: "Photo submitted successfully!",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Photo Submission</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Upload Photo</h2>
          <Input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="mb-4"
          />
          <div className="flex gap-4">
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Take Photo</h2>
          <div className="relative aspect-video mb-4">
            {isCapturing ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <span className="text-gray-500">No photo captured</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {!isCapturing ? (
              <Button onClick={startCamera}>Start Camera</Button>
            ) : (
              <>
                <Button onClick={capturePhoto}>Capture</Button>
                <Button variant="destructive" onClick={stopCamera}>
                  Stop Camera
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Button onClick={handleSubmit} disabled={!selectedFile}>
          Submit Photo
        </Button>
      </div>
    </div>
  );
};

export default PhotoSubmissionPage;
