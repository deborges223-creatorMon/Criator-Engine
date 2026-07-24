import React, { useEffect, useRef, useState } from 'react';

export const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

export const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  return match ? match[1] : null;
};

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  
  if (lower.startsWith('data:video/')) return true;
  if (lower.startsWith('blob:')) return true;
  if (getYouTubeId(url) !== null) return true;
  if (getVimeoId(url) !== null) return true;

  // Direct video file extensions
  if (lower.match(/\.(mp4|webm|ogg|mov|m4v|mkv|avi|flv|3gp)(\?.*)?$/)) return true;

  // Cloudinary & CDN video indicators
  if (lower.includes('cloudinary') && (lower.includes('/video/') || lower.includes('.mp4') || lower.includes('.webm') || lower.includes('/upload/'))) {
    return true;
  }

  if (
    lower.includes('.mp4') ||
    lower.includes('.webm') ||
    lower.includes('.mov') ||
    lower.includes('/video/') ||
    lower.includes('video') ||
    lower.includes('stream') ||
    lower.includes('media')
  ) {
    return true;
  }

  // Fallback for web URLs without explicit static image extensions
  const isExplicitImage = lower.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/);
  if (!isExplicitImage && (lower.startsWith('http://') || lower.startsWith('https://'))) {
    return true;
  }

  return false;
};

interface BackgroundMediaProps {
  src?: string;
  bgImage?: string;
  posX?: number;
  bgPosX?: number;
  posY?: number;
  bgPosY?: number;
  zoom?: number;
  bgZoom?: number;
  className?: string;
}

export const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  src,
  bgImage,
  posX,
  bgPosX,
  posY,
  bgPosY,
  zoom,
  bgZoom,
  className = '',
}) => {
  const bgUrl = src || bgImage || '/background.jpg';
  const finalX = posX ?? bgPosX ?? 0;
  const finalY = posY ?? bgPosY ?? 0;
  const finalZoom = zoom ?? bgZoom ?? 100;

  const [hasError, setHasError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const youtubeId = getYouTubeId(bgUrl);
  const vimeoId = getVimeoId(bgUrl);
  const isVideo = isVideoUrl(bgUrl);

  const style: React.CSSProperties = {
    transform: `translate(${finalX}%, ${finalY}%) scale(${finalZoom / 100})`,
    transformOrigin: 'center center',
  };

  useEffect(() => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
      const promise = videoRef.current.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Background video autoplay issue:', err);
        });
      }
    }
  }, [bgUrl]);

  // YouTube Embed
  if (youtubeId) {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={style}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&autohide=1&modestbranding=1&rel=0&enablejsapi=1`}
          title="Background Video YouTube"
          className="w-[150%] h-[150%] -top-[25%] -left-[25%] absolute object-cover border-0"
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  }

  // Vimeo Embed
  if (vimeoId) {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={style}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`}
          title="Background Video Vimeo"
          className="w-[150%] h-[150%] -top-[25%] -left-[25%] absolute object-cover border-0"
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  }

  // Direct HTML5 Video
  if (isVideo && !hasError) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src={bgUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => {
            console.error('Failed to load video source:', bgUrl);
            setHasError(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-75 ${className}`}
          style={style}
        />
      </div>
    );
  }

  // Direct Image Fallback
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-75 ${className}`}
        style={{
          ...style,
          backgroundImage: `url("${bgUrl}")`,
        }}
      />
      {hasError && (
        <div className="absolute bottom-2 left-2 bg-red-950/90 text-red-200 border border-red-500 text-[10px] px-2 py-1 rounded shadow z-50">
          ⚠️ Não foi possível reproduzir este vídeo. Verifique se o link é direto (.mp4/.webm) ou do YouTube.
        </div>
      )}
    </div>
  );
};
