import React from 'react';
import styles from '../../css/landing.module.css';
import LayoutProvider from '@theme/Layout/Provider';
import SkipToContent from '@theme/SkipToContent';
import {
  PageMetadata,
  SkipToContentFallbackId,
} from '@docusaurus/theme-common';
import Navigation from './Navigation';
import Footer from './Footer';
import { pageTitle, blurb } from '../../landing/content';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <LayoutProvider>
      <PageMetadata title={pageTitle} description={blurb} />
      <SkipToContent />
      <div className={styles.page}>
        <div aria-hidden="true" className={styles.pageGuide} />
        <Navigation />
        <main id={SkipToContentFallbackId} className={styles.grid}>
          {children}
        </main>
        <Footer />
      </div>
    </LayoutProvider>
  );
}
