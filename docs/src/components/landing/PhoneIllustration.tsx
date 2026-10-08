import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../../css/landing.module.css';
import Illustration from './Illustration';
import RNLogo from './RNLogo';
import TopIsland from './TopIsland';
type IntroPhase = 'logo' | 'island' | 'numbers' | 'sheet' | 'done';

export default function PhoneIllustration(): React.ReactElement {
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const sheetContainer = useRef<HTMLDivElement>(null);
  const [introPhase, setIntroPhase] = useState<IntroPhase>('logo');
  const [introStarted, setIntroStarted] = useState(false);
  const phoneContainer = useRef<HTMLElement>(null);
  const showSheet =
    sheetLoaded &&
    (introPhase === 'numbers' ||
      introPhase === 'sheet' ||
      introPhase === 'done');
  const handleLogoEntranceComplete = useCallback(() => {
    setIntroPhase((phase) => (phase === 'logo' ? 'island' : phase));
  }, []);
  const handleIslandExpansionComplete = useCallback(() => {
    setIntroPhase((phase) => (phase === 'island' ? 'numbers' : phase));
  }, []);
  const handleIslandCountComplete = useCallback(() => {
    setIntroPhase((phase) => (phase === 'numbers' ? 'sheet' : phase));
  }, []);
  useEffect(() => {
    if (introStarted) return;
    const phone = phoneContainer.current;
    if (!phone) return;
    const desktop = window.matchMedia('(min-width: 801px)');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.intersectionRatio >= 0.5) {
          setIntroStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    const updateTrigger = () => {
      if (desktop.matches) {
        setIntroStarted(true);
        observer.disconnect();
      } else {
        observer.observe(phone);
      }
    };
    updateTrigger();
    desktop.addEventListener('change', updateTrigger);
    return () => {
      observer.disconnect();
      desktop.removeEventListener('change', updateTrigger);
    };
  }, [introStarted]);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const skipIntro = () => {
      if (motion.matches) setIntroPhase('done');
    };
    skipIntro();
    motion.addEventListener('change', skipIntro);
    return () => motion.removeEventListener('change', skipIntro);
  }, []);
  useEffect(() => {
    // Cached images can finish loading before React attaches the load handler.
    const image = sheetContainer.current?.querySelector('img');
    if (image?.complete && image.naturalWidth > 0) {
      setSheetLoaded(true);
    }
  }, []);
  return (
    <figure ref={phoneContainer} className={styles.phone}>
      <Illustration
        file="phone.png"
        alt="Phone outline"
        width={336}
        height={780}
        className={styles.responsiveImage}
      />
      <TopIsland
        active={introPhase !== 'logo'}
        onExpansionComplete={handleIslandExpansionComplete}
        onCountComplete={handleIslandCountComplete}
      />
      <RNLogo
        active={introStarted || introPhase === 'done'}
        onEntranceComplete={handleLogoEntranceComplete}
      />
      <div ref={sheetContainer} className={styles.sheetClip}>
        <Illustration
          file="bottom-sheet.png"
          alt="Ease versus Reanimated latency comparison"
          width={894}
          height={723}
          onLoad={() => setSheetLoaded(true)}
          className={[
            styles.bottomSheet,
            showSheet ? styles.bottomSheetEnter : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) {
              setIntroPhase((phase) => (phase === 'sheet' ? 'done' : phase));
            }
          }}
          data-visible={showSheet}
        />
      </div>
    </figure>
  );
}
