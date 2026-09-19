import React, { useRef, useState } from 'react';
import { soundFX } from '../utils/soundEffects';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // Tilt intensity (default 8)
  glare?: boolean;
  onClick?: () => void;
  playAudioOnHover?: boolean;
}

export const TiltCard3D: React.FC<TiltCard3DProps> = ({
  children,
  className = '',
  intensity = 7,
  glare = true,
  onClick,
  playAudioOnHover = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number; glareX: number; glareY: number }>({
    x: 0,
    y: 0,
    glareX: 50,
    glareY: 50
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (playAudioOnHover) {
      soundFX.playHoverSound();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015) translateZ(6px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0px)',
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
        transformStyle: 'preserve-3d'
      }}
      className={`relative transition-shadow duration-300 ${
        isHovered ? 'shadow-2xl shadow-emerald-500/10' : ''
      } ${className}`}
    >
      {children}

      {/* Dynamic 3D Glare Spotlight on Hover */}
      {glare && isHovered && (
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none z-20 transition-opacity duration-300 opacity-40"
          style={{
            background: `radial-gradient(circle 350px at ${tilt.glareX}% ${tilt.glareY}%, rgba(16, 185, 129, 0.12), transparent 70%)`
          }}
        />
      )}
    </div>
  );
};
