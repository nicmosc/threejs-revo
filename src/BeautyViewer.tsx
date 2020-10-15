import React, { useEffect, useRef } from 'react';
import { Pan } from './App';

import { useLoadImages } from './use-load-images';

interface BeautyViewerProps {
  currentFrame: number;
  frames: number;
  zoom: number;
  pan: Pan;
  activeEntityId?: string;
  url: string;
}

export const BeautyViewer = ({ currentFrame, frames, zoom, pan, url }: BeautyViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { images } = useLoadImages(url, frames);

  const handleDrawImage = () => {
    if (canvasRef.current != null && images != null) {
      const { innerWidth: cWidth, innerHeight: cHeight } = window;
      canvasRef.current.width = cWidth;
      canvasRef.current.height = cHeight;

      const context = canvasRef.current.getContext('2d');
      const currentImage = images[currentFrame];
      const imageRatio = currentImage.width / currentImage.height;
      const newImageWidth = cHeight * imageRatio * zoom;
      const newImageHeight = cHeight * zoom;
      const xDifference = cWidth - newImageWidth;
      const yDifference = cHeight - newImageHeight;

      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context?.drawImage(
        currentImage,
        0,
        0,
        currentImage.width,
        currentImage.height,
        xDifference / 2 - pan.dx,
        yDifference / 2 - pan.dy,
        window.innerWidth + xDifference * -1,
        window.innerHeight + yDifference * -1,
      );
    }
  };

  useEffect(() => {
    handleDrawImage();
  }, [currentFrame, canvasRef, images, zoom, pan]);

  useEffect(() => {
    window.addEventListener('resize', handleDrawImage);

    handleDrawImage();

    return () => {
      window.removeEventListener('resize', handleDrawImage);
    };
  }, [canvasRef, images, currentFrame, zoom]);

  return (
    <div
      style={{
        zIndex: 0,
        pointerEvents: 'none',
      }}>
      <canvas width={window.innerWidth} height={window.innerHeight} ref={canvasRef} />
    </div>
  );
};
