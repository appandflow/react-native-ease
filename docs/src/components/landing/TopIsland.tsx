import React, { useEffect, useRef, useState } from 'react';
import styles from '../../css/landing.module.css';
import Illustration from './Illustration';

type TopIslandProps = {
  active: boolean;
  onExpansionComplete: () => void;
  onCountComplete: () => void;
};

export default function TopIsland({
  active,
  onExpansionComplete,
  onCountComplete,
}: TopIslandProps): React.ReactElement {
  const [islandLoaded, setIslandLoaded] = useState(false);
  const islandContainer = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [islandNumbers, setIslandNumbers] = useState({ size: '0', fps: '0' });
  const showIsland = islandLoaded && active;

  useEffect(() => {
    // Cached images can load before React attaches the load handler.
    const image = islandContainer.current?.querySelector('img');
    if (image?.complete && image.naturalWidth > 0) setIslandLoaded(true);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motion.matches);
    updateMotion();
    motion.addEventListener('change', updateMotion);
    return () => motion.removeEventListener('change', updateMotion);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setIslandNumbers({ size: '2', fps: '120' });
      return;
    }
    if (!expanded) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min((performance.now() - startedAt) / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setIslandNumbers({
        size: String(Math.round(2 * eased)),
        fps: String(Math.round(120 * eased)),
      });
      if (progress === 1) {
        window.clearInterval(timer);
        onCountComplete();
      }
    }, 30);
    return () => window.clearInterval(timer);
  }, [expanded, reducedMotion, onCountComplete]);

  return (
    <div
      ref={islandContainer}
      className={[styles.island, showIsland ? styles.islandEnter : undefined]
        .filter(Boolean)
        .join(' ')}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          setExpanded(true);
          onExpansionComplete();
        }
      }}
      data-visible={showIsland}
    >
      <Illustration
        file="ios-island.png"
        width={894}
        height={282}
        onLoad={() => setIslandLoaded(true)}
        className={styles.responsiveImage}
      />
      <div className={styles.islandStats}>
        <div className={styles.threadStat}>
          <div className={styles.threadValue}>0%</div>
          <div className={styles.threadLabel}>
            JS Thread
            <br />
            Utilization
          </div>
        </div>
        <div className={styles.bundleStat}>
          <div
            role="img"
            aria-label="Approximately 2 kilobytes"
            className={styles.bundleValue}
          >
            <span aria-hidden="true">~{islandNumbers.size}KB</span>
          </div>
          <div className={styles.bundleLabel}>Bundle Size impact</div>
        </div>
        <div className={styles.fpsStat}>
          <div
            role="img"
            aria-label="120 frames per second"
            className={styles.fpsValue}
          >
            <span aria-hidden="true">{islandNumbers.fps}</span>
            <span aria-hidden="true" className={styles.fpsUnit}>
              fps
            </span>
          </div>
          <div className={styles.fpsLabel}>
            Frame rate
            <br />
            (per second)
          </div>
        </div>
      </div>
    </div>
  );
}
