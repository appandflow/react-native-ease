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

export default function Home() {
  const fontBase = useBaseUrl('/fonts/');
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const sheetContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Cached images can finish loading before React attaches the load handler.
    const image = sheetContainer.current?.querySelector('img');
    if (image?.complete && image.naturalWidth > 0) {
      setSheetLoaded(true);
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
            .ease-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'hero' 'phone' 'features'; }
            .ease-phone { margin: 32px auto 0; }
            .ease-navigation { padding-top: 24px !important; padding-bottom: 24px !important; gap: 12px !important; }
            .ease-mark { position: static !important; margin-right: 4px; }
            .ease-hero { min-height: 300px !important; }
            .ease-hero::after { right: calc(-1 * var(--ease-inset)); }
            .ease-features { padding-top: 40px !important; }
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
          <Link to="/" style={navStyle}>
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
                className={sheetLoaded ? 'ease-bottom-sheet-enter' : undefined}
                style={{
                  position: 'absolute',
                  left: '3.3%',
                  bottom: '3.5%',
                  width: '93.4%',
                  height: 'auto',
                  visibility: sheetLoaded ? 'visible' : 'hidden',
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
