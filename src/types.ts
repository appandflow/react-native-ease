import type { ColorValue } from 'react-native';

/** Cubic bezier control points: [x1, y1, x2, y2]. */
export type CubicBezier = [number, number, number, number];

/** Easing curve for timing animations. */
export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | CubicBezier;

/** Timing-based transition with fixed duration and easing curve. */
export type TimingTransition = {
  type: 'timing';
  /** Duration in milliseconds. @default 300 */
  duration?: number;
  /** Easing curve. @default 'easeInOut' */
  easing?: EasingType;
  /** Loop mode — 'repeat' restarts from the beginning, 'reverse' alternates direction. */
  loop?: 'repeat' | 'reverse';
  /** Delay in milliseconds before the animation starts. @default 0 */
  delay?: number;
};

/** Physics-based spring transition. */
export type SpringTransition = {
  type: 'spring';
  /** Friction — higher values reduce oscillation. @default 15 */
  damping?: number;
  /** Spring constant — higher values mean faster animation. @default 120 */
  stiffness?: number;
  /** Mass of the object — higher values mean slower, more momentum. @default 1 */
  mass?: number;
  /**
   * Initial velocity, in animated-property units per second, signed in value
   * space — positive means the value is already moving up. Units follow the JS
   * side: DIPs for translateX/translateY, degrees for rotate, unitless for
   * scale and opacity. Ignored on web. @default 0
   */
  velocity?: number;
  /** Delay in milliseconds before the animation starts. @default 0 */
  delay?: number;
};

/** No transition — values are applied immediately without animation. */
export type NoneTransition = {
  type: 'none';
};

/** A single animation transition configuration. */
export type SingleTransition =
  | TimingTransition
  | SpringTransition
  | NoneTransition;

/** Per-property transition map with category-based keys. */
export type TransitionMap = {
  /** Fallback config for properties not explicitly listed. */
  default?: SingleTransition;
  /** Config for all transform properties (translateX/Y, scaleX/Y, rotate, rotateX/Y). */
  transform?: SingleTransition;
  /** Config for opacity. */
  opacity?: SingleTransition;
  /** Config for borderRadius. */
  borderRadius?: SingleTransition;
  /** Config for backgroundColor. */
  backgroundColor?: SingleTransition;
  /** Config for border properties (borderWidth, borderColor). */
  border?: SingleTransition;
  /** Config for shadow properties (shadowOpacity, shadowRadius, shadowColor, shadowOffset) and elevation. */
  shadow?: SingleTransition;
};

/** Animation transition configuration — either a single config or a per-property map. */
export type Transition = SingleTransition | TransitionMap;

/** Event fired when the animation ends. */
export type TransitionEndEvent = {
  /** True if the animation completed naturally, false if interrupted. */
  finished: boolean;
};

/**
 * Values of a view's animated properties as rendered. Keys mirror the
 * `animate` prop that was set; colors are reported as `rgba()` strings.
 */
export type AnimatedValues = Omit<
  AnimateProps,
  'backgroundColor' | 'borderColor' | 'shadowColor'
> & {
  backgroundColor?: string;
  borderColor?: string;
  shadowColor?: string;
};

/** Event fired once `paused` has frozen the view's animations. */
export type PausedEvent = {
  /** The values on screen at the moment the animations were paused. */
  values: AnimatedValues;
};

/** Transform origin as 0–1 fractions. Default is center (0.5, 0.5). */
export type TransformOrigin = {
  /** Horizontal origin. 0 = left, 0.5 = center, 1 = right. @default 0.5 */
  x?: number;
  /** Vertical origin. 0 = top, 0.5 = center, 1 = bottom. @default 0.5 */
  y?: number;
};

/**
 * Distance of the camera from the z=0 plane for 3D transforms (rotateX, rotateY).
 * Higher values produce a flatter, more telephoto look; lower values exaggerate
 * perspective. @default 1280 (matches React Native default)
 *
 * **iOS note:** On iOS, the parent view must not be flattened by Fabric for
 * perspective to render correctly. Ensure the parent has `collapsable={false}`
 * or a style that prevents flattening (e.g. `transform`, `opacity`, `zIndex`).
 */
export type TransformPerspective = number;

/** Animatable view properties. Unspecified properties default to their identity values. */
export type AnimateProps = {
  /** View opacity (0–1). @default 1 */
  opacity?: number;
  /** Horizontal translation in pixels. @default 0 */
  translateX?: number;
  /** Vertical translation in pixels. @default 0 */
  translateY?: number;
  /** Uniform scale factor (shorthand for scaleX + scaleY). @default 1 */
  scale?: number;
  /** Horizontal scale factor. Overrides `scale` for the X axis. @default 1 */
  scaleX?: number;
  /** Vertical scale factor. Overrides `scale` for the Y axis. @default 1 */
  scaleY?: number;
  /** Z-axis rotation in degrees. @default 0 */
  rotate?: number;
  /** X-axis rotation in degrees (3D). @default 0 */
  rotateX?: number;
  /** Y-axis rotation in degrees (3D). @default 0 */
  rotateY?: number;
  /** Border radius in pixels. Uses hardware-accelerated clipping (ViewOutlineProvider on Android, layer.cornerRadius on iOS). @default 0 */
  borderRadius?: number;
  /** Background color. Accepts any React Native color value. @default 'transparent' */
  backgroundColor?: ColorValue;
  /** Border width in pixels. @default 0 */
  borderWidth?: number;
  /** Border color. Accepts any React Native color value. @default 'black' */
  borderColor?: ColorValue;
  /** Shadow opacity (0–1, iOS only). @default 0 */
  shadowOpacity?: number;
  /** Shadow blur radius (iOS only). @default 0 */
  shadowRadius?: number;
  /** Shadow color (iOS only). Accepts any React Native color value. @default 'black' */
  shadowColor?: ColorValue;
  /** Shadow offset (iOS only). @default { width: 0, height: 0 } */
  shadowOffset?: { width?: number; height?: number };
  /** Android elevation for material shadow. @default 0 */
  elevation?: number;
};
