import React from 'react';
import LandingLayout from '../components/landing/LandingLayout';
import Hero from '../components/landing/Hero';
import PhoneIllustration from '../components/landing/PhoneIllustration';
import FeatureList from '../components/landing/FeatureList';

export default function Home(): React.ReactElement {
  return (
    <LandingLayout>
      <Hero />
      <PhoneIllustration />
      <FeatureList />
    </LandingLayout>
  );
}
