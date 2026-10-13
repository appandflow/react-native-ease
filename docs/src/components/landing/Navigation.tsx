import React from 'react';
import styles from '../../css/landing.module.css';
import Link from '@docusaurus/Link';
import Illustration from './Illustration';
import { github, productName } from '../../landing/content';
import packageJson from '../../../../package.json';

export default function Navigation(): React.ReactElement {
  return (
    <nav aria-label="Main navigation" className={styles.navigation}>
      <Link
        href="https://appandflow.com"
        aria-label="App and Flow"
        className={styles.mark}
      >
        <Illustration file="mark.svg" width={24} height={24} />
      </Link>
      <Link to="/" className={styles.productName}>
        {productName}
      </Link>
      <Link
        href={github}
        aria-label={`GitHub repository, version ${packageJson.version}`}
        className={styles.githubLink}
      >
        <Illustration file="github.svg" width={16} height={16} />
        <span aria-hidden="true">·</span> v{packageJson.version}
      </Link>
      <Link to="/docs/" className={styles.navLink}>
        Documentation
      </Link>
      <Link to="/docs/api-reference" className={styles.navLink}>
        API
      </Link>
    </nav>
  );
}
