import { StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import NativeEaseView, { type NativeProps } from './EaseViewNativeComponent';
import type {
  AnimateProps,
  CubicBezier,
  SingleTransition,
  Transition,
  TransitionEndEvent,
  TransformOrigin,
  TransformPerspective,
} from './types';

/** Identity values used as defaults for animate/initialAnimate. */
const IDENTITY = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  borderRadius: 0,
  borderWidth: 0,
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffsetWidth: 0,
  shadowOffsetHeight: 0,
  elevation: 0,
};

/** Bitmask flags — must match native constants. */
/* eslint-disable no-bitwise */
const MASK_OPACITY = 1 << 0;
const MASK_TRANSLATE_X = 1 << 1;
const MASK_TRANSLATE_Y = 1 << 2;
const MASK_SCALE_X = 1 << 3;
const MASK_SCALE_Y = 1 << 4;
const MASK_ROTATE = 1 << 5;
const MASK_ROTATE_X = 1 << 6;
const MASK_ROTATE_Y = 1 << 7;
const MASK_BORDER_RADIUS = 1 << 8;
const MASK_BACKGROUND_COLOR = 1 << 9;
const MASK_BORDER_WIDTH = 1 << 10;
const MASK_BORDER_COLOR = 1 << 11;
const MASK_SHADOW_OPACITY = 1 << 12;
const MASK_SHADOW_RADIUS = 1 << 13;
const MASK_SHADOW_COLOR = 1 << 14;
const MASK_SHADOW_OFFSET = 1 << 15;
const MASK_ELEVATION = 1 << 16;
/* eslint-enable no-bitwise */

/** Maps animate prop keys to style keys that conflict. */
const ANIMATE_TO_STYLE_KEYS: Record<keyof AnimateProps, string> = {
  opacity: 'opacity',
  translateX: 'transform',
  translateY: 'transform',
  scale: 'transform',
  scaleX: 'transform',
  scaleY: 'transform',
  rotate: 'transform',
  rotateX: 'transform',
  rotateY: 'transform',
  borderRadius: 'borderRadius',
  backgroundColor: 'backgroundColor',
  borderWidth: 'borderWidth',
  borderColor: 'borderColor',
  shadowOpacity: 'shadowOpacity',
  shadowRadius: 'shadowRadius',
  shadowColor: 'shadowColor',
  shadowOffset: 'shadowOffset',
  elevation: 'elevation',
};

/** Preset easing curves as cubic bezier control points. */
const EASING_PRESETS: Record<string, CubicBezier> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

/** Returns true if the transition is a SingleTransition (has a `type` field). */
function isSingleTransition(t: Transition): t is SingleTransition {
  return 'type' in t;
}

type NativeTransitions = NonNullable<NativeProps['transitions']>;
type NativeTransitionConfig = NativeTransitions['defaultConfig'];

/** Default config: timing 300ms easeInOut. */
const DEFAULT_CONFIG: NativeTransitionConfig = {
  type: 'timing',
  duration: 300,
  easingBezier: [0.42, 0, 0.58, 1],
  damping: 15,
  stiffness: 120,
  mass: 1,
  velocity: 0,
  loop: 'none',
  delay: 0,
};

/** Resolve a SingleTransition into a native config object. */
function resolveSingleConfig(config: SingleTransition): NativeTransitionConfig {
  const type = config.type as string;
  const duration = config.type === 'timing' ? config.duration ?? 300 : 300;
  const rawEasing =
    config.type === 'timing' ? config.easing ?? 'easeInOut' : 'easeInOut';
  if (__DEV__) {
    if (Array.isArray(rawEasing)) {
      if ((rawEasing as number[]).length !== 4) {
        console.warn(
          'react-native-ease: Custom easing must be a [x1, y1, x2, y2] tuple (got length ' +
            (rawEasing as number[]).length +
            ').',
        );
      }
      if (
        rawEasing[0] < 0 ||
        rawEasing[0] > 1 ||
        rawEasing[2] < 0 ||
        rawEasing[2] > 1
      ) {
        console.warn(
          'react-native-ease: Easing x-values (x1, x2) must be between 0 and 1.',
        );
      }
    }
  }
  const easingBezier: number[] = Array.isArray(rawEasing)
    ? rawEasing
    : EASING_PRESETS[rawEasing]!;
  const damping = config.type === 'spring' ? config.damping ?? 15 : 15;
  const stiffness = config.type === 'spring' ? config.stiffness ?? 120 : 120;
  const mass = config.type === 'spring' ? config.mass ?? 1 : 1;
  const velocity = config.type === 'spring' ? config.velocity ?? 0 : 0;
  const loop: string =
    config.type === 'timing' ? config.loop ?? 'none' : 'none';
  const delay =
    config.type === 'timing' || config.type === 'spring'
      ? config.delay ?? 0
      : 0;
  return {
    type,
    duration,
    easingBezier,
    damping,
    stiffness,
    mass,
    velocity,
    loop,
    delay,
  };
}

/** Category keys that map to optional NativeTransitions fields. */
const CATEGORY_KEYS = [
  'transform',
  'opacity',
  'borderRadius',
  'backgroundColor',
  'border',
  'shadow',
] as const;

/** Resolve the transition prop into a NativeTransitions struct. */
function resolveTransitions(transition?: Transition): NativeTransitions {
  // No transition: timing default for all properties
  if (transition == null) {
    return { defaultConfig: DEFAULT_CONFIG };
  }

  // Single transition: set as defaultConfig only
  if (isSingleTransition(transition)) {
    return { defaultConfig: resolveSingleConfig(transition) };
  }

  // TransitionMap: resolve defaultConfig + only specified category keys
  const defaultConfig = transition.default
    ? resolveSingleConfig(transition.default)
    : DEFAULT_CONFIG;

  const result: NativeTransitions = { defaultConfig };

  for (const key of CATEGORY_KEYS) {
    const specific = transition[key];
    if (specific != null) {
      (result as Record<string, NativeTransitionConfig>)[key] =
        resolveSingleConfig(specific);
    }
  }

  return result;
}

export type EaseViewProps = ViewProps & {
  /** Target values for animated properties. */
  animate?: AnimateProps;
  /** Starting values for enter animations. Animates to `animate` on mount. */
  initialAnimate?: AnimateProps;
  /** Target values for exit animations. Used by `EasePresence` before unmount. */
  exit?: AnimateProps;
  /** Animation configuration (timing or spring). */
  transition?: Transition;
  /** Called when all animations complete. Reports whether they finished naturally or were interrupted. */
  onTransitionEnd?: (event: TransitionEndEvent) => void;
  /**
   * Enable Android hardware layer during animations. The view is rasterized to
   * a GPU texture so animated property changes (opacity, scale, rotation) are
   * composited on the RenderThread without redrawing the view hierarchy.
   *
   * **Trade-offs:**
   * - Faster rendering of opacity/scale/rotation animations.
   * - Uses additional GPU memory for the off-screen texture.
   * - Children that overflow the view's layout bounds are clipped by the
   *   texture, which can cause visual artifacts with `translateX`/`translateY`.
   *
   * Best suited for views that animate opacity, scale, or rotation without
   * overflowing children. No-op on iOS where Core Animation already composites
   * off the main thread.
   * @default false
   */
  useHardwareLayer?: boolean;
  /** Pivot point for scale and rotation as 0–1 fractions. @default { x: 0.5, y: 0.5 } (center) */
  transformOrigin?: TransformOrigin;
  /**
   * Distance of the camera from the z=0 plane for 3D transforms (rotateX,
   * rotateY). Higher values produce a flatter look; lower values exaggerate
   * perspective.
   *
   * **iOS note:** On iOS, the parent view must not be flattened by Fabric for
   * perspective to render correctly. Ensure the parent has `collapsable={false}`
   * or a style that prevents flattening (e.g. `transform`, `opacity`, `zIndex`).
   *
   * @default 1280
   */
  transformPerspective?: TransformPerspective;
  /** NativeWind / Uniwind / Tailwind CSS class string. Requires a compatible className interop in your project. */
  className?: string;
};

export function EaseView({
  animate,
  initialAnimate,
  exit: _exit,
  transition,
  onTransitionEnd,
  useHardwareLayer = false,
  transformOrigin,
  transformPerspective,
  style,
  ...rest
}: EaseViewProps) {
  // Compute bitmask of which properties are animated.
  // Native uses this to skip non-animated properties (lets style handle them).
  /* eslint-disable no-bitwise */
  let animatedProperties = 0;
  if (animate?.opacity != null) animatedProperties |= MASK_OPACITY;
  if (animate?.translateX != null) animatedProperties |= MASK_TRANSLATE_X;
  if (animate?.translateY != null) animatedProperties |= MASK_TRANSLATE_Y;
  if (animate?.scaleX != null || animate?.scale != null)
    animatedProperties |= MASK_SCALE_X;
  if (animate?.scaleY != null || animate?.scale != null)
    animatedProperties |= MASK_SCALE_Y;
  if (animate?.rotate != null) animatedProperties |= MASK_ROTATE;
  if (animate?.rotateX != null) animatedProperties |= MASK_ROTATE_X;
  if (animate?.rotateY != null) animatedProperties |= MASK_ROTATE_Y;
  if (animate?.borderRadius != null) animatedProperties |= MASK_BORDER_RADIUS;
  if (animate?.backgroundColor != null)
    animatedProperties |= MASK_BACKGROUND_COLOR;
  if (animate?.borderWidth != null) animatedProperties |= MASK_BORDER_WIDTH;
  if (animate?.borderColor != null) animatedProperties |= MASK_BORDER_COLOR;
  if (animate?.shadowOpacity != null) animatedProperties |= MASK_SHADOW_OPACITY;
  if (animate?.shadowRadius != null) animatedProperties |= MASK_SHADOW_RADIUS;
  if (animate?.shadowColor != null) animatedProperties |= MASK_SHADOW_COLOR;
  if (animate?.shadowOffset != null) animatedProperties |= MASK_SHADOW_OFFSET;
  if (animate?.elevation != null) animatedProperties |= MASK_ELEVATION;
  /* eslint-enable no-bitwise */

  // Resolve animate values (identity defaults for non-animated — safe values).
  const resolved = {
    ...IDENTITY,
    ...animate,
    scaleX: animate?.scaleX ?? animate?.scale ?? IDENTITY.scaleX,
    scaleY: animate?.scaleY ?? animate?.scale ?? IDENTITY.scaleY,
    rotateX: animate?.rotateX ?? IDENTITY.rotateX,
    rotateY: animate?.rotateY ?? IDENTITY.rotateY,
    // Flatten shadowOffset object into individual values for native
    shadowOffsetWidth: animate?.shadowOffset?.width ?? 0,
    shadowOffsetHeight: animate?.shadowOffset?.height ?? 0,
  };

  // Resolve initialAnimate:
  // - No initialAnimate: same as resolved (no enter animation)
  // - With initialAnimate: use initial values for animated properties,
  //   falling back to identity defaults.
  const initial = initialAnimate ?? animate;
  const resolvedInitial = {
    ...IDENTITY,
    ...initial,
    scaleX: initial?.scaleX ?? initial?.scale ?? IDENTITY.scaleX,
    scaleY: initial?.scaleY ?? initial?.scale ?? IDENTITY.scaleY,
    rotateX: initial?.rotateX ?? IDENTITY.rotateX,
    rotateY: initial?.rotateY ?? IDENTITY.rotateY,
    shadowOffsetWidth: initial?.shadowOffset?.width ?? 0,
    shadowOffsetHeight: initial?.shadowOffset?.height ?? 0,
  };

  // Resolve color props — passed as ColorValue directly (codegen handles conversion)
  const animBgColor = animate?.backgroundColor ?? 'transparent';
  const initialBgColor = initialAnimate?.backgroundColor ?? animBgColor;
  const animBorderColor = animate?.borderColor ?? 'black';
  const initialBorderColor = initialAnimate?.borderColor ?? animBorderColor;
  const animShadowColor = animate?.shadowColor ?? 'black';
  const initialShadowColor = initialAnimate?.shadowColor ?? animShadowColor;

  // Strip style keys that conflict with animated properties
  let cleanStyle: ViewProps['style'] = style;
  if (animate && style) {
    const flat = StyleSheet.flatten(style) as Record<string, unknown>;
    if (flat) {
      const conflicting = new Set<string>();
      for (const key of Object.keys(animate) as (keyof AnimateProps)[]) {
        if (animate[key] != null) {
          const styleKey = ANIMATE_TO_STYLE_KEYS[key];
          if (styleKey && styleKey in flat) {
            conflicting.add(styleKey);
          }
        }
      }
      if (conflicting.size > 0) {
        if (__DEV__) {
          console.warn(
            `react-native-ease: ${[...conflicting].join(
              ', ',
            )} found in both style and animate. ` +
              'The animated value takes priority; the style value will be ignored.',
          );
        }
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(flat)) {
          if (!conflicting.has(k)) {
            cleaned[k] = v;
          }
        }
        cleanStyle = cleaned as ViewStyle;
      }
    }
  }

  // Resolve transition config into a fully-populated struct
  const transitions = resolveTransitions(transition);

  const handleTransitionEnd = onTransitionEnd
    ? (event: { nativeEvent: { finished: boolean } }) =>
        onTransitionEnd(event.nativeEvent)
    : undefined;

  return (
    <NativeEaseView
      style={cleanStyle}
      onTransitionEnd={handleTransitionEnd}
      animatedProperties={animatedProperties}
      animateOpacity={resolved.opacity}
      animateTranslateX={resolved.translateX}
      animateTranslateY={resolved.translateY}
      animateScaleX={resolved.scaleX}
      animateScaleY={resolved.scaleY}
      animateRotate={resolved.rotate}
      animateRotateX={resolved.rotateX}
      animateRotateY={resolved.rotateY}
      animateBorderRadius={resolved.borderRadius}
      animateBackgroundColor={animBgColor}
      animateBorderWidth={resolved.borderWidth}
      animateBorderColor={animBorderColor}
      animateShadowOpacity={resolved.shadowOpacity}
      animateShadowRadius={resolved.shadowRadius}
      animateShadowColor={animShadowColor}
      animateShadowOffsetX={resolved.shadowOffsetWidth}
      animateShadowOffsetY={resolved.shadowOffsetHeight}
      animateElevation={resolved.elevation}
      initialAnimateOpacity={resolvedInitial.opacity}
      initialAnimateTranslateX={resolvedInitial.translateX}
      initialAnimateTranslateY={resolvedInitial.translateY}
      initialAnimateScaleX={resolvedInitial.scaleX}
      initialAnimateScaleY={resolvedInitial.scaleY}
      initialAnimateRotate={resolvedInitial.rotate}
      initialAnimateRotateX={resolvedInitial.rotateX}
      initialAnimateRotateY={resolvedInitial.rotateY}
      initialAnimateBorderRadius={resolvedInitial.borderRadius}
      initialAnimateBackgroundColor={initialBgColor}
      initialAnimateBorderWidth={resolvedInitial.borderWidth}
      initialAnimateBorderColor={initialBorderColor}
      initialAnimateShadowOpacity={resolvedInitial.shadowOpacity}
      initialAnimateShadowRadius={resolvedInitial.shadowRadius}
      initialAnimateShadowColor={initialShadowColor}
      initialAnimateShadowOffsetX={resolvedInitial.shadowOffsetWidth}
      initialAnimateShadowOffsetY={resolvedInitial.shadowOffsetHeight}
      initialAnimateElevation={resolvedInitial.elevation}
      transitions={transitions}
      useHardwareLayer={useHardwareLayer}
      transformOriginX={transformOrigin?.x ?? 0.5}
      transformOriginY={transformOrigin?.y ?? 0.5}
      transformPerspective={transformPerspective ?? 1280}
      {...rest}
    />
  );
}
