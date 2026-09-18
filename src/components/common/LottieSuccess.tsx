import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import successAnimationData from '../../assets/lottie-success.json';

interface LottieSuccessProps {
  size?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  onComplete?: () => void;
}

export function LottieSuccess({
  size = 140,
  className = '',
  loop = false,
  autoplay = true,
  onComplete
}: LottieSuccessProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous instance if any
    if (animRef.current) {
      animRef.current.destroy();
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        animationData: successAnimationData
      });

      if (onComplete) {
        animRef.current.addEventListener('complete', () => {
          onComplete();
        });
      }
    } catch (err) {
      console.warn('Lottie failed to load:', err);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [loop, autoplay, onComplete]);

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Success animation"
    />
  );
}
