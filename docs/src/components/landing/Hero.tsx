import React from 'react';
import styles from '../../css/landing.module.css';
import Link from '@docusaurus/Link';
import CopyInstallCommand from './CopyInstallCommand';
import { pageTitle, blurb, command } from '../../landing/content';
export default function Hero(): React.ReactElement {
  return (
    <header className={styles.hero}>
      <h1 className={styles.title}>{pageTitle}</h1>
      <p className={styles.blurb}>{blurb}</p>
      <div className={styles.heroActions}>
        <Link to="/docs/" className={styles.getStarted}>
          Get started
        </Link>
        <CopyInstallCommand command={command} />
      </div>
    </header>
  );
}
