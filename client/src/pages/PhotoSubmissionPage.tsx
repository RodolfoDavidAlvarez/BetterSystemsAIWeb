import React, { useState, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { toast } from "../hooks/use-toast";

interface AnalysisResult {
  message: string;
  confidence: number;
  labels: string[];
}

const PhotoSubmissionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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

    const formData = new FormData();
    formData.append('photo', selectedFile);

    try {
      setIsUploading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Photo uploaded successfully! Analyzing...",
        });
        
        // Poll for analysis results
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        const pollInterval = setInterval(async () => {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error("Analysis timeout");
          }
          
          try {
            const analysisResponse = await fetch('/api/photo-analysis');
            const analysisData = await analysisResponse.json();
            
            if (analysisData.result) {
              clearInterval(pollInterval);
              setAnalysisResult(analysisData.result);
            }
          } catch (error) {
            console.error('Error polling analysis:', error);
          }
          attempts++;
        }, 1000);

        setSelectedFile(null);
        setPreviewUrl(null);
        if (stream) {
          stopCamera();
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Photo Submission</h1>
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
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
                  <span className="text-gray-500">No photo selected</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-40"
              variant="outline"
            >
              Upload Photo
            </Button>
            {!isCapturing ? (
              <Button onClick={startCamera} className="w-40">
                Take Photo
              </Button>
            ) : (
              <Button onClick={capturePhoto} className="w-40">
                Capture
              </Button>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {selectedFile && (
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleSubmit}
              className="w-full max-w-xs"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Analyzing..." : "Submit Photo"}
            </Button>
            <Button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                if (stream) {
                  stopCamera();
                }
                setAnalysisResult(null);
                setIsUploading(false);
              }}
              className="w-full max-w-xs"
              variant="outline"
              disabled={isUploading}
            >
              Reset
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Analyzing photo...</p>
          </div>
        )}

        {analysisResult && (
          <Card className="mt-4 p-4">
            <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
            <div className="space-y-2">
              <p className="text-sm">{analysisResult.message}</p>
              <p className="text-sm">Confidence: {(analysisResult.confidence * 100).toFixed(1)}%</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.labels.map((label, index) => (
                  <span key={index} className="text-xs bg-secondary px-2 py-1 rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default PhotoSubmissionPage;
