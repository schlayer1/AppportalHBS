import { useState, useEffect } from 'react';

export interface OrientationData {
  tiltX: number; // -1 to 1
  tiltY: number; // -1 to 1
  isSupported: boolean;
}

export function useDeviceOrientation(): OrientationData {
  const [orientation, setOrientation] = useState<OrientationData>({
    tiltX: 0,
    tiltY: 0,
    isSupported: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      return;
    }

    let isMounted = true;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!isMounted) return;
      const gamma = e.gamma || 0; // -90 to 90 (left-to-right)
      const beta = e.beta || 0;   // -180 to 180 (front-to-back)

      // Normalize: assuming holding phone at around 45deg
      const normalizedX = Math.max(-1, Math.min(1, gamma / 30));
      const normalizedY = Math.max(-1, Math.min(1, (beta - 45) / 30));

      setOrientation({
        tiltX: Number(normalizedX.toFixed(3)),
        tiltY: Number(normalizedY.toFixed(3)),
        isSupported: true,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });

    return () => {
      isMounted = false;
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return orientation;
}
