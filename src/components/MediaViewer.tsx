import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MediaViewerProps {
  url: string;
  type: 'video' | 'file';
  title: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ url, type, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center">
      <iframe 
        src={url}
        className="w-full h-full border-none"
        allowFullScreen
        allow="autoplay; encrypted-media"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
      
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-30 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
      >
        {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>
    </div>
  );
};
