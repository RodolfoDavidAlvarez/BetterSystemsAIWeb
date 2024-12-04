import React, { useState, useRef, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { toast } from "../hooks/use-toast";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

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
  const [isMobile] = useState(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  const [usingFrontCamera, setUsingFrontCamera] = useState(true);
  // Cleanup stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
      // First check if the device has camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your device or browser does not support camera access');
      }

      // Request permissions first
      await navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            throw new Error('Camera permission denied. Please enable camera access in your browser settings.');
          }
        })
        .catch(() => {
          // Some browsers might not support the permissions API, continue anyway
          console.log('Permissions API not supported, continuing with camera request');
        });

      // Try to get the list of available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found on your device');
      }

      // Reset any existing streams
      if (stream) {
        stopCamera();
      }

      // Request camera access with fallback options
      // Try to get the rear camera first on mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: isMobile ? { ideal: 'environment', exact: 'environment' } : 'user',
          aspectRatio: { ideal: 16/9 }
        }
      }).catch(async () => {
        // If rear camera fails, fallback to any available camera
        return navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
            aspectRatio: { ideal: 16/9 }
          }
        });
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('autoplay', '');
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('muted', '');
        
        // Ensure video loads before proceeding
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        await videoRef.current.play();
        console.log('Video stream started successfully');
        
        setStream(mediaStream);
        setIsCapturing(true);
        
        toast({
          title: "Camera Active",
          description: "Camera started successfully. Click 'Capture' when ready to take a photo.",
        });
      } else {
        throw new Error('Video element not initialized');
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast({
        title: "Camera Error",
        description: err instanceof Error 
          ? err.message 
          : "Unable to access camera. Please ensure you've granted camera permissions and try again.",
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
        
        // Start polling for analysis results
        const pollTimeout = 30000; // 30 seconds timeout
        const pollInterval = 2000; // Poll every 2 seconds
        const startTime = Date.now();
        
        const pollForResults = async () => {
          const timeoutReached = Date.now() - startTime >= pollTimeout;
          
          if (timeoutReached) {
            setIsUploading(false);
            toast({
              title: "Analysis Timeout",
              description: "The analysis is taking longer than expected. Please try again.",
              variant: "destructive",
            });
            return;
          }

          try {
            const analysisResponse = await fetch('/api/photo-analysis');
            if (!analysisResponse.ok) {
              throw new Error('Analysis request failed');
            }
            const analysisData = await analysisResponse.json();
            
            if (analysisData.result) {
              setAnalysisResult(analysisData.result);
              setIsUploading(false);
              return true; // Polling complete
            }
          } catch (error) {
            console.error('Error polling analysis:', error);
          }
          
          return false; // Continue polling
        };

        let pollingTimer: NodeJS.Timeout;
        
        const startPolling = async () => {
          const complete = await pollForResults();
          if (!complete) {
            pollingTimer = setTimeout(startPolling, pollInterval);
          }
        };

        startPolling();

        // Cleanup timer on component unmount
        return () => {
          if (pollingTimer) {
            clearTimeout(pollingTimer);
          }
        };

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
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeIn}
        className="max-w-3xl mx-auto text-center mb-8"
      >
        <p className="text-sm font-medium text-muted-foreground/80 tracking-wide mb-2">Better Systems AI</p>
        <h1 className="text-4xl font-bold mb-4">AI Photo Analysis</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Experience our advanced AI photo analysis technology. Upload or capture a photo, 
          and let our AI analyze its contents with detailed insights.
        </p>
      </motion.div>
      <Card className="p-6 max-w-2xl mx-auto shadow-lg">
        <div className="mb-8">
          <div className="relative aspect-video mb-4">
            {isCapturing ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg"
                style={{ transform: 'scaleX(-1)' }} // Mirror the video for a more natural selfie experience
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
              <>
                <Button onClick={capturePhoto} className="w-40">
                  Capture
                </Button>
                {isMobile && (
                  <Button
                    onClick={async () => {
                      setUsingFrontCamera(!usingFrontCamera);
                      if (stream) {
                        stopCamera();
                        await new Promise(resolve => setTimeout(resolve, 100));
                        startCamera();
                      }
                    }}
                    variant="outline"
                    className="w-40"
                  >
                    Switch Camera
                  </Button>
                )}
              </>
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
