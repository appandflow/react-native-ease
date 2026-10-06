import React from 'react';
import Link from '@docusaurus/Link';
import Illustration from './Illustration';

const features = [
  {
    title: 'An API that feels like React',
    description:
      'Set your target values with animate and control how they change with transition. EaseView takes children, styles, and standard view props, so you can use it like any other component.',
    to: '/docs/usage',
    icon: 'react.svg',
  },
  {
    title: 'Native animation, no JS loop',
    description:
      'Ease uses Core Animation on iOS and ObjectAnimator and SpringAnimation on Android. Once an animation starts, the native APIs handle the updates instead of a JavaScript animation loop.',
    to: '/docs/how-it-works',
    icon: 'phone.svg',
  },
  {
    title: 'Pick the transition you need',
    description:
      'Use an easing curve for a fade, a spring for movement, or different transitions for different properties. Set the duration, damping, stiffness, and delay when you need to fine-tune an animation.',
    to: '/docs/usage#per-property-transitions',
    icon: 'transition.svg',
  },
];

export default function FeatureList(): React.ReactElement {
  return (
    <section
      aria-label="Features"
      className="ease-features"
      style={{ gridArea: 'features', paddingTop: 30, paddingBottom: 30 }}
    >
      <div style={{ display: 'grid', gap: 32, maxWidth: 520 }}>
        {features.map(({ title, description, to, icon }) => (
          <article key={title}>
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 16,
                fontFamily: 'inherit',
                fontWeight: 600,
                letterSpacing: '-0.32px',
                lineHeight: '24px',
              }}
            >
              <Link
                to={to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#121212',
                }}
              >
                <Illustration file={icon} width={24} height={24} />
                <span>{title}</span>
              </Link>
            </h2>
            <p
              style={{
                margin: 0,
                color: '#828282',
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.5,
                letterSpacing: '-0.16px',
              }}
            >
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
