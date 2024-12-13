'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "react-hot-toast";
import dynamic from 'next/dynamic';
import CanvasDraw from 'react-canvas-draw';

interface CanvasSize {
  width: number;
  height: number;
}

// Define a type for the canvas element we need to access
interface ExtendedCanvasDraw extends CanvasDraw {
  canvasContainer: HTMLDivElement;
  clear: () => void;
}

const ImageEditor = () => {
  const [brushSize, setBrushSize] = useState<number>(20);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const canvasRef = useRef<ExtendedCanvasDraw>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        setCanvasSize({
          width: container.offsetWidth,
          height: 600
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setOriginalImage(reader.result);
        if (canvasRef.current) {
          canvasRef.current.clear();
        }
        toast.success('Image uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      setMaskImage(null);
      toast.success('Canvas cleared');
    }
  };

  const handleExport = () => {
    if (canvasRef.current) {
      try {
        // Get canvas data
        const drawingCanvas = canvasRef.current.canvasContainer.children[1] as HTMLCanvasElement;
        const context = drawingCanvas.getContext('2d');
        if (!context) return;

        const imageData = context.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        const data = imageData.data;

        // Create a new canvas for the mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = drawingCanvas.width;
        maskCanvas.height = drawingCanvas.height;
        const maskContext = maskCanvas.getContext('2d');
        if (!maskContext) return;
        
        // Fill with black background
        maskContext.fillStyle = 'black';
        maskContext.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Create mask image data
        const maskImageData = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const maskData = maskImageData.data;

        // Convert drawing to pure black and white
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) { // If there's any opacity
            // Set to white
            maskData[i] = 255;     // R
            maskData[i + 1] = 255; // G
            maskData[i + 2] = 255; // B
            maskData[i + 3] = 255; // A
          }
        }

        // Put the mask data back
        maskContext.putImageData(maskImageData, 0, 0);

        // Get the final mask as data URL
        const maskDataUrl = maskCanvas.toDataURL('image/png');
        setMaskImage(maskDataUrl);

        // Download mask
        const link = document.createElement('a');
        link.download = 'mask.png';
        link.href = maskDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Mask exported successfully');
      } catch (error) {
        toast.error('Failed to export mask');
        console.error('Export error:', error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => fileInputRef.current?.click()}>
              Upload Image
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear Canvas
            </Button>
            <Button onClick={handleExport}>
              Export Mask
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Brush Size: {brushSize}px</label>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              min={1}
              max={50}
              step={1}
            />
          </div>
          
          <div id="canvas-container" className="border rounded-lg overflow-hidden bg-black">
            {originalImage && (
              <div style={{ position: 'relative', width: canvasSize.width, height: canvasSize.height }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage}
                  alt="Original"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: 0.5
                  }}
                />
                <CanvasDraw
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ref={canvasRef as any}
                  brushColor="white"
                  backgroundColor="transparent"
                  brushRadius={brushSize / 2}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  hideGrid
                  style={{ position: 'absolute', zIndex: 1 }}
                />
              </div>
            )}
            {!originalImage && (
              <div style={{ height: canvasSize.height }} className="flex items-center justify-center text-gray-400">
                Upload an image to start
              </div>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png"
            className="hidden"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Original Image</h3>
          {originalImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={originalImage} 
              alt="Original" 
              className="rounded-lg border w-full" 
            />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Mask</h3>
          {maskImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={maskImage} 
              alt="Mask" 
              className="rounded-lg border w-full" 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(ImageEditor), { ssr: false });