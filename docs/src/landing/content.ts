export const github = 'https://github.com/AppAndFlow/react-native-ease';
export const productName = 'react-native-ease';
export const pageTitle = 'Native Animations';
export const blurb =
  'Give EaseView your target values and a transition, and let iOS and Android handle the animation – all from the React state you already have.';
export const command = 'npm install react-native-ease';

export const features = [
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
