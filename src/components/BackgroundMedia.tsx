import React from 'react';

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  if (lower.startsWith('data:video/')) return true;
  if (lower.match(/\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/)) return true;
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
  const isVideo = isVideoUrl(bgUrl);

  const style: React.CSSProperties = {
    transform: `translate(${finalX}%, ${finalY}%) scale(${finalZoom / 100})`,
    transformOrigin: 'center center',
  };

  if (isVideo) {
    return (
      <video
        src={bgUrl}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-75 ${className}`}
        style={style}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-75 ${className}`}
      style={{
        ...style,
        backgroundImage: `url("${bgUrl}")`,
      }}
    />
  );
};
