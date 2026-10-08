import React from 'react';
import styles from '../../css/landing.module.css';
import Link from '@docusaurus/Link';
import Illustration from './Illustration';

import { features } from '../../landing/content';

export default function FeatureList(): React.ReactElement {
  return (
    <section aria-label="Features" className={styles.features}>
      <div className={styles.featureGrid}>
        {features.map(({ title, description, to, icon }) => (
          <article key={title}>
            <h2 className={styles.featureTitle}>
              <Link to={to} className={styles.featureLink}>
                <Illustration file={icon} width={24} height={24} />
                <span>{title}</span>
              </Link>
            </h2>
            <p className={styles.featureDescription}>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
