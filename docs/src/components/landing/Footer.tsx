import React from 'react';
import styles from '../../css/landing.module.css';
import Link from '@docusaurus/Link';
import { github } from '../../landing/content';
export default function Footer(): React.ReactElement {
  return (
    <footer className={styles.footer}>
      <span>
        Made by{' '}
        <Link href="https://appandflow.com" className={styles.attributionLink}>
          App&amp;Flow
        </Link>
      </span>
      <span aria-hidden="true">·</span>
      <Link href={`${github}/blob/main/LICENSE`} className={styles.licenseLink}>
        licensed under the MIT License
      </Link>
    </footer>
  );
}
