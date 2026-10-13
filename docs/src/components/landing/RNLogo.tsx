import React, { useEffect, useRef, useState } from 'react';
import styles from '../../css/landing.module.css';
import Illustration from './Illustration';

type RNLogoProps = {
  active: boolean;
  onEntranceComplete: () => void;
};

export default function RNLogo({
  active,
  onEntranceComplete,
}: RNLogoProps): React.ReactElement {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [circleLoaded, setCircleLoaded] = useState(false);
  const logoContainer = useRef<HTMLDivElement>(null);
  const logoReady = logoLoaded && circleLoaded && active;

  useEffect(() => {
    // Cached images can finish loading before React attaches the load handlers.
    const logo =
      logoContainer.current?.querySelector<HTMLImageElement>(
        'img[alt="React"]',
      );
    if (logo?.complete && logo.naturalWidth > 0) setLogoLoaded(true);
    const circle = logoContainer.current?.querySelector<HTMLImageElement>(
      'img[src$="rn-circle.png"]',
    );
    if (circle?.complete && circle.naturalWidth > 0) setCircleLoaded(true);
  }, []);

  return (
    <div ref={logoContainer} className={styles.logoGroup}>
      <Illustration
        file="rn-circle.png"
        className={[styles.circleImage, logoReady ? styles.rnCircle : undefined]
          .filter(Boolean)
          .join(' ')}
        onLoad={() => setCircleLoaded(true)}
        width={830}
        height={830}
        data-visible={logoReady}
      />
      <Illustration
        file="rn-logo.png"
        className={[styles.logoImage, logoReady ? styles.rnLogo : undefined]
          .filter(Boolean)
          .join(' ')}
        onLoad={() => setLogoLoaded(true)}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) {
            onEntranceComplete();
          }
        }}
        alt="React"
        width={409}
        height={368}
        data-visible={logoReady}
      />
    </div>
  );
}
