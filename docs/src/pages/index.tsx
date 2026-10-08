import React, { useEffect, useRef, useState } from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import LayoutProvider from '@theme/Layout/Provider';
import SkipToContent from '@theme/SkipToContent';
import {
  PageMetadata,
  SkipToContentFallbackId,
} from '@docusaurus/theme-common';
import Illustration from '../components/landing/Illustration';
import FeatureList from '../components/landing/FeatureList';
import CopyInstallCommand from '../components/landing/CopyInstallCommand';
import packageJson from '../../../package.json';

const github = 'https://github.com/AppAndFlow/react-native-ease';
const navStyle: React.CSSProperties = {
  color: '#828282',
  whiteSpace: 'nowrap',
};

type IntroPhase = 'logo' | 'island' | 'numbers' | 'sheet' | 'done';

export default function Home() {
  const fontBase = useBaseUrl('/fonts/');
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const sheetContainer = useRef<HTMLDivElement>(null);
  const [islandLoaded, setIslandLoaded] = useState(false);
  const islandContainer = useRef<HTMLDivElement>(null);
  const [introPhase, setIntroPhase] = useState<IntroPhase>('logo');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [circleLoaded, setCircleLoaded] = useState(false);
  const [introStarted, setIntroStarted] = useState(false);
  const phoneContainer = useRef<HTMLElement>(null);
  const logoReady =
    logoLoaded && circleLoaded && (introStarted || introPhase === 'done');
  const logoContainer = useRef<HTMLDivElement>(null);
  const showIsland = islandLoaded && introPhase !== 'logo';
  const showSheet =
    sheetLoaded &&
    (introPhase === 'numbers' ||
      introPhase === 'sheet' ||
      introPhase === 'done');
  const [islandNumbers, setIslandNumbers] = useState({ size: '0', fps: '0' });
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
    let timer: number | undefined;
    const showFinalNumbers = () => {
      window.clearInterval(timer);
      setIslandNumbers({ size: '2', fps: '120' });
      setIntroPhase('done');
    };
    if (motion.matches) {
      showFinalNumbers();
    } else if (introPhase === 'numbers') {
      const startedAt = performance.now();
      timer = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        const progress = Math.min(elapsed / 600, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setIslandNumbers({
          size: String(Math.round(2 * eased)),
          fps: String(Math.round(120 * eased)),
        });
        if (progress === 1) {
          window.clearInterval(timer);
          setIntroPhase('sheet');
        }
      }, 30);
    }
    const stopForReducedMotion = () => {
      if (motion.matches) showFinalNumbers();
    };
    motion.addEventListener('change', stopForReducedMotion);
    return () => {
      window.clearInterval(timer);
      motion.removeEventListener('change', stopForReducedMotion);
    };
  }, [introPhase]);
  useEffect(() => {
    const logo =
      logoContainer.current?.querySelector<HTMLImageElement>(
        'img[alt="React"]',
      );
    if (logo?.complete && logo.naturalWidth > 0) setLogoLoaded(true);
    const circle = logoContainer.current?.querySelector<HTMLImageElement>(
      'img[src$="rn-circle.png"]',
    );
    if (circle?.complete && circle.naturalWidth > 0) setCircleLoaded(true);
    // Cached images can finish loading before React attaches the load handler.
    const image = sheetContainer.current?.querySelector('img');
    if (image?.complete && image.naturalWidth > 0) {
      setSheetLoaded(true);
    }
    const island = islandContainer.current?.querySelector('img');
    if (island?.complete && island.naturalWidth > 0) {
      setIslandLoaded(true);
    }
  }, []);
  return (
    <LayoutProvider>
      <PageMetadata
        title="Native Animations"
        description="Give EaseView your target values and a transition, and let iOS and Android handle the animation – all from the React state you already have."
      />
      <Head>
        {/* Font declarations and breakpoints cannot be expressed as inline styles. */}
        <style>{`
          @font-face { font-family: 'Ease Inter'; src: url('${fontBase}InterVariable.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
          @font-face { font-family: 'GT Maru'; src: url('${fontBase}GT-Maru-Bold.ttf') format('truetype'); font-weight: 700; font-display: swap; }
          @font-face { font-family: 'JetBrains Mono'; src: url('${fontBase}JetBrainsMono-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
          .ease-page { --ease-inset: clamp(24px, 8.625vw, 138px); --ifm-heading-color: #121212; }
          .ease-grid { display: grid; grid-template-columns: minmax(0, 520px) minmax(335px, 1fr); grid-template-areas: 'hero phone' 'features phone'; column-gap: 60px; }
          .ease-hero::after { content: ''; position: absolute; left: calc(-1 * var(--ease-inset)); right: calc(-100vw + var(--ease-inset) + 100%); bottom: 0; height: 1px; background: #f0f0f0; pointer-events: none; }
          .ease-phone { position: relative; width: 100%; margin-top: -38px; margin-bottom: 23px; justify-self: center; transform: translateX(62px); }
          @keyframes ease-sheet-up {
            from { transform: translateY(calc(100% + 40px)); }
            to { transform: translateY(0); }
          }
          .ease-bottom-sheet-enter { animation: ease-sheet-up 700ms cubic-bezier(0.22, 1, 0.36, 1) both; }
          @keyframes ease-circle-spin {
            to { transform: rotate(360deg); }
          }
          @keyframes ease-circle-reveal {
            from { opacity: 0; scale: 0.8; }
            to { opacity: 1; scale: 1; }
          }
          .ease-rn-circle { animation: ease-circle-reveal 600ms cubic-bezier(0.22, 1, 0.36, 1) 400ms both, ease-circle-spin 20s linear infinite; }
          @keyframes ease-logo-enter {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          .ease-rn-logo { animation: ease-logo-enter 600ms cubic-bezier(0.22, 1, 0.36, 1) 400ms both; }
          @keyframes ease-island-expand {
            0% { clip-path: inset(5.3% 35.1% 67% 34.6% round 999px); transform: scale(1); }
            65% { clip-path: inset(0 round 13.1% / 41.5%); transform: scale(1.035, 1.08); }
            82% { clip-path: inset(0 round 13.1% / 41.5%); transform: scale(0.99, 0.97); }
            100% { clip-path: inset(0 round 13.1% / 41.5%); transform: scale(1); }
          }
          @keyframes ease-island-reveal {
            from { opacity: 0; filter: blur(5px); }
            to { opacity: 1; filter: blur(0); }
          }
          .ease-island-enter { animation: ease-island-expand 600ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both; }
          .ease-island-enter .ease-island-stats { animation: ease-island-reveal 300ms ease-out 550ms both; }
          .ease-page a:hover { text-decoration: underline; text-underline-offset: 4px; }
          .ease-page :focus-visible { outline: 2px solid #008cff; outline-offset: 5px; border-radius: 3px; }
          .ease-copy-button { transition: transform 200ms ease; }
          .ease-page .ease-get-started { text-decoration: none; transition: transform 150ms ease; }
          .ease-page .ease-get-started:hover { text-decoration: none; }
          .ease-get-started:active { transform: scale(0.96); }
          @media (hover: hover) {
            .ease-copy-button:hover { transform: scale(1.15); }
          }
          @media (prefers-reduced-motion: reduce) {
            .ease-island-enter, .ease-island-enter .ease-island-stats { animation: none; }
            .ease-rn-circle { animation: none; }
            .ease-rn-logo { animation: none; }
            .ease-bottom-sheet-enter { animation: none; }
            .ease-copy-button { transition: none; }
            .ease-page .ease-get-started { transition: none; }
          }
          @media (min-width: 801px) {
            .ease-phone { position: sticky; top: 24px; width: min(100%, calc((100dvh - 48px) * 336 / 780)); }
          }
          @media (max-width: 1100px) {
            .ease-grid { column-gap: 32px; grid-template-columns: minmax(0, 1fr) 300px; }
            .ease-phone { transform: none; }
          }
          @media (max-width: 800px) {
            .ease-page { --ease-inset: 23px; }
            .ease-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'hero' 'phone' 'features'; }
            .ease-phone { width: 210px; margin: 24px auto 32px; }
            .ease-navigation { display: grid !important; grid-template-columns: 45px max-content max-content 1fr; height: 53px; min-height: 0 !important; margin-top: 56px; border-top: 1px solid #f0f0f0; padding: 0 23px 0 0 !important; gap: 0 16px !important; }
            .ease-mark { position: static !important; grid-row: 1; justify-content: center; align-self: stretch; align-items: center; border-right: 1px solid #f0f0f0; }
            .ease-mark img { width: 12px; height: 12px; }
            .ease-product-name { display: none; }
            .ease-page-guide { display: none; }
            .ease-hero { min-height: auto !important; padding-top: 32px !important; padding-bottom: 0 !important; }
            .ease-hero h1 { font-size: 24px !important; line-height: 1.2 !important; letter-spacing: -0.96px !important; }
            .ease-hero > p { margin-bottom: 0 !important; }
            .ease-hero-actions { flex-direction: column; align-items: flex-start !important; gap: 16px !important; margin-top: 16px !important; }
            .ease-hero::after { display: none; }
            .ease-features { position: relative; padding-top: 40px !important; }
            .ease-features::before { content: ''; position: absolute; top: 0; left: calc(-1 * var(--ease-inset)); right: calc(-1 * var(--ease-inset)); border-top: 1px solid #f0f0f0; }
            .ease-features > div { gap: 48px !important; }
          }
        `}</style>
      </Head>
      <SkipToContent />
      <div
        className="ease-page"
        style={{
          position: 'relative',
          overflow: 'clip',
          minHeight: '100vh',
          background: '#fff',
          color: '#121212',
          fontFamily: '"Ease Inter", sans-serif',
          fontWeight: 500,
        }}
      >
        <div
          aria-hidden="true"
          className="ease-page-guide"
          style={{
            position: 'absolute',
            left: 'max(12px, calc(var(--ease-inset) - 30px))',
            top: 0,
            bottom: 0,
            width: 1,
            background: '#f0f0f0',
            pointerEvents: 'none',
          }}
        />
        <nav
          aria-label="Main navigation"
          className="ease-navigation"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            minHeight: 103,
            padding: '24px var(--ease-inset)',
            borderBottom: '1px solid #f0f0f0',
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          <Link
            href="https://appandflow.com"
            aria-label="App and Flow"
            className="ease-mark"
            style={{
              position: 'absolute',
              left: 'calc(var(--ease-inset) / 2 - 27px)',
              display: 'flex',
            }}
          >
            <Illustration file="mark.svg" width={24} height={24} />
          </Link>
          <Link to="/" className="ease-product-name" style={navStyle}>
            react-native-ease
          </Link>
          <Link
            href={github}
            aria-label={`GitHub repository, version ${packageJson.version}`}
            style={{
              ...navStyle,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Illustration file="github.svg" width={16} height={16} />
            <span aria-hidden="true">·</span> v{packageJson.version}
          </Link>
          <Link to="/docs/" style={navStyle}>
            Documentation
          </Link>
          <Link to="/docs/api-reference" style={navStyle}>
            API
          </Link>
        </nav>
        <main
          id={SkipToContentFallbackId}
          className="ease-grid"
          style={{ padding: '0 var(--ease-inset)' }}
        >
          <header
            className="ease-hero"
            style={{
              gridArea: 'hero',
              position: 'relative',
              minHeight: 329,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              paddingTop: 26,
              paddingBottom: 32,
            }}
          >
            <h1
              style={{
                margin: '0 0 16px',
                fontFamily: '"GT Maru", "Ease Inter", sans-serif',
                fontSize: 'clamp(28px, 3vw, 36px)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-1.44px',
              }}
            >
              Native Animations
            </h1>
            <p
              style={{
                margin: '0 0 32px',
                maxWidth: 456,
                fontSize: 16,
                color: '#828282',
                lineHeight: 1.5,
                letterSpacing: '-0.16px',
              }}
            >
              Give EaseView your target values and a transition, and let iOS and
              Android handle the animation – all from the React state you
              already have.
            </p>
            <div
              className="ease-hero-actions"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 16,
                marginTop: 'auto',
              }}
            >
              <Link
                to="/docs/"
                className="ease-get-started"
                style={{
                  padding: '8px 16px',
                  borderRadius: 40,
                  background: '#121212',
                  color: '#fff',
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                Get started
              </Link>
              <CopyInstallCommand command="npm install react-native-ease" />
            </div>
          </header>
          <figure
            ref={phoneContainer}
            className="ease-phone"
            style={{
              gridArea: 'phone',
              zIndex: 1,
              maxWidth: 336,
              alignSelf: 'start',
              marginLeft: 0,
              marginRight: 0,
            }}
          >
            <Illustration
              file="phone.png"
              alt="Phone outline"
              width={336}
              height={780}
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
            <div
              ref={islandContainer}
              className={showIsland ? 'ease-island-enter' : undefined}
              onAnimationEnd={(event) => {
                if (
                  event.target === event.currentTarget &&
                  event.animationName === 'ease-island-expand'
                ) {
                  setIntroPhase((phase) =>
                    phase === 'island' ? 'numbers' : phase,
                  );
                }
              }}
              style={{
                position: 'absolute',
                left: '5.37%',
                top: '2.31%',
                width: '88.9%',
                aspectRatio: '894 / 282',
                containerType: 'inline-size',
                pointerEvents: 'none',
                visibility: showIsland ? 'visible' : 'hidden',
                color: '#fff',
                lineHeight: 1.2,
                transformOrigin: '50% 0%',
              }}
            >
              <Illustration
                file="ios-island.png"
                width={894}
                height={282}
                onLoad={() => setIslandLoaded(true)}
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
              <div
                className="ease-island-stats"
                style={{ position: 'absolute', inset: 0 }}
              >
                <div
                  style={{ position: 'absolute', left: '8.72%', top: '24.47%' }}
                >
                  <div
                    style={{
                      fontSize: '6.71cqw',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    0%
                  </div>
                  <div
                    style={{
                      marginTop: '1.68cqw',
                      fontSize: '3.36cqw',
                      color: 'rgba(255,255,255,0.6)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    JS Thread
                    <br />
                    Utilization
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: '31%',
                    right: '31%',
                    top: '52.23%',
                    textAlign: 'center',
                    letterSpacing: '-0.02em',
                  }}
                >
                  <div
                    role="img"
                    aria-label="Approximately 2 kilobytes"
                    style={{
                      fontSize: '4.7cqw',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span aria-hidden="true">~{islandNumbers.size}KB</span>
                  </div>
                  <div style={{ fontSize: '2.35cqw', fontWeight: 500 }}>
                    Bundle Size impact
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: '9.73%',
                    top: '24.47%',
                    textAlign: 'right',
                    letterSpacing: '-0.02em',
                  }}
                >
                  <div
                    role="img"
                    aria-label="120 frames per second"
                    style={{
                      fontSize: '6.71cqw',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span aria-hidden="true">{islandNumbers.fps}</span>
                    <span
                      aria-hidden="true"
                      style={{ fontSize: '4.03cqw', marginLeft: '0.67cqw' }}
                    >
                      fps
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: '1.68cqw',
                      fontSize: '3.36cqw',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    Frame rate
                    <br />
                    (per second)
                  </div>
                </div>
              </div>
            </div>
            <div
              ref={logoContainer}
              style={{
                position: 'absolute',
                left: '50%',
                top: '39.65%',
                width: '82.53%',
                aspectRatio: '1',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            >
              <Illustration
                file="rn-circle.png"
                className={logoReady ? 'ease-rn-circle' : undefined}
                onLoad={() => setCircleLoaded(true)}
                width={830}
                height={830}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  visibility: logoReady ? 'visible' : 'hidden',
                }}
              />
              <Illustration
                file="rn-logo.png"
                className={logoReady ? 'ease-rn-logo' : undefined}
                onLoad={() => setLogoLoaded(true)}
                onAnimationEnd={(event) => {
                  if (event.animationName === 'ease-logo-enter') {
                    setIntroPhase((phase) =>
                      phase === 'logo' ? 'island' : phase,
                    );
                  }
                }}
                alt="React"
                width={409}
                height={368}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  visibility: logoReady ? 'visible' : 'hidden',
                  width: '49.28%',
                  height: 'auto',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
            <div
              ref={sheetContainer}
              style={{
                position: 'absolute',
                inset: '1% 2.4%',
                overflow: 'hidden',
                borderRadius: '17% / 7%',
                pointerEvents: 'none',
              }}
            >
              <Illustration
                file="bottom-sheet.png"
                alt="Ease versus Reanimated latency comparison"
                width={894}
                height={723}
                onLoad={() => setSheetLoaded(true)}
                className={showSheet ? 'ease-bottom-sheet-enter' : undefined}
                onAnimationEnd={(event) => {
                  if (event.animationName === 'ease-sheet-up') {
                    setIntroPhase((phase) =>
                      phase === 'sheet' ? 'done' : phase,
                    );
                  }
                }}
                style={{
                  position: 'absolute',
                  left: '3.3%',
                  bottom: '3.5%',
                  width: '93.4%',
                  height: 'auto',
                  visibility: showSheet ? 'visible' : 'hidden',
                }}
              />
            </div>
          </figure>
          <FeatureList />
        </main>
        <footer
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '22px var(--ease-inset) 26px',
            borderTop: '1px dashed #ededed',
            fontSize: 12,
            lineHeight: 1.4,
            color: '#828282',
          }}
        >
          <span>
            Made by{' '}
            <Link
              href="https://appandflow.com"
              style={{ color: '#008cff', textDecoration: 'underline' }}
            >
              App&amp;Flow
            </Link>
          </span>
          <span aria-hidden="true">·</span>
          <Link
            href={`${github}/blob/main/LICENSE`}
            style={{ color: '#828282' }}
          >
            licensed under the MIT License
          </Link>
        </footer>
      </div>
    </LayoutProvider>
  );
}
