import React from 'react';
import wmUrl from '../assets/wm.svg?url';

interface WatermarkOverlayProps {
  opacity?: number;
  sizeRatio?: number; // width as % of container
  minWidth?: number;  // px
  maxWidth?: number;  // px
  offset?: number;    // px spacing from edges
  className?: string;
}

const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  opacity = 0.28,
  sizeRatio = 0.15,
  minWidth = 32,
  maxWidth = 120,
  offset = 8,
  className = ''
}) => {
  const widthValue = `clamp(${minWidth}px, ${Math.round(sizeRatio * 100)}%, ${maxWidth}px)`;

  return (
    <img
      src={wmUrl}
      alt="Watermark"
      style={{
        position: 'absolute',
        right: offset,
        bottom: offset,
        opacity,
        width: widthValue,
        height: 'auto',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 5,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'
      }}
      className={className}
    />
  );
};

export default WatermarkOverlay;