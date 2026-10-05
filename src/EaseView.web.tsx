import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
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
const IDENTITY: Required<
  Omit<
    AnimateProps,
    'scale' | 'backgroundColor' | 'borderColor' | 'shadowColor' | 'shadowOffset'
  >
> & { shadowOffset: { width: number; height: number } } = {
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
  shadowOffset: { width: 0, height: 0 },
  elevation: 0,
};

/** Preset easing curves as cubic bezier control points. */
const EASING_PRESETS: Record<string, CubicBezier> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

// ---------------------------------------------------------------------------
// Spring simulation → CSS linear() easing
// ---------------------------------------------------------------------------

/** Simulate a damped spring from 0 → 1 and return settling duration + sample points. */
function simulateSpring(
  damping: number,
  stiffness: number,
  mass: number,
): { durationMs: number; points: number[] } {
  const dt = 1 / 120; // 120 Hz simulation
  const maxTime = 10; // 10s safety cap
  let x = 0;
  let v = 0;
  const samples: number[] = [0];
  let step = 0;

  while (step * dt < maxTime) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
    step++;
    // Downsample to ~60 fps (every 2nd sample)
    if (step % 2 === 0) {
      samples.push(Math.round(x * 10000) / 10000);
    }
    // Settled?
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.001) break;
  }

  // Ensure last point is exactly 1
  samples[samples.length - 1] = 1;

  return {
    durationMs: Math.round(step * dt * 1000),
    points: samples,
  };
}

/** Cache for computed spring easing strings (keyed by damping-stiffness-mass). */
const springCache = new Map<string, { duration: number; easing: string }>();

function getSpringEasing(
  damping: number,
  stiffness: number,
  mass: number,
): { duration: number; easing: string } {
  const key = `${damping}-${stiffness}-${mass}`;
  let cached = springCache.get(key);
  if (cached) return cached;

  const { durationMs, points } = simulateSpring(damping, stiffness, mass);
  const easing = `linear(${points.join(', ')})`;
  cached = { duration: durationMs, easing };
  springCache.set(key, cached);
  return cached;
}

/** Detect CSS linear() support (lazy, cached). */
let linearSupported: boolean | null = null;
function supportsLinearEasing(): boolean {
  if (linearSupported != null) return linearSupported;
  try {
    const el = document.createElement('div');
    el.style.transitionTimingFunction = 'linear(0, 1)';
    linearSupported = el.style.transitionTimingFunction !== '';
  } catch {
    linearSupported = false;
  }
  return linearSupported;
}

const SPRING_FALLBACK_EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

export type EaseViewProps = {
  animate?: AnimateProps;
  initialAnimate?: AnimateProps;
  /** Target values for exit animations. Used by `EasePresence` before unmount. */
  exit?: AnimateProps;
  transition?: Transition;
  onTransitionEnd?: (event: TransitionEndEvent) => void;
  /** No-op on web. */
  useHardwareLayer?: boolean;
  transformOrigin?: TransformOrigin;
  /**
   * Distance of the camera from the z=0 plane for 3D transforms (rotateX, rotateY).
   * Higher values produce a flatter, more telephoto look; lower values exaggerate
   * perspective. @default 1280
   */
  transformPerspective?: TransformPerspective;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

function resolveAnimateValues(
  props: AnimateProps | undefined,
): typeof IDENTITY & {
  backgroundColor?: string;
  borderColor?: string;
  shadowColor?: string;
} {
  return {
    ...IDENTITY,
    ...props,
    scaleX: props?.scaleX ?? props?.scale ?? IDENTITY.scaleX,
    scaleY: props?.scaleY ?? props?.scale ?? IDENTITY.scaleY,
    rotateX: props?.rotateX ?? IDENTITY.rotateX,
    rotateY: props?.rotateY ?? IDENTITY.rotateY,
    shadowOffset: {
      width: props?.shadowOffset?.width ?? 0,
      height: props?.shadowOffset?.height ?? 0,
    },
    backgroundColor: props?.backgroundColor as string | undefined,
    borderColor: props?.borderColor as string | undefined,
    shadowColor: props?.shadowColor as string | undefined,
  };
}

function buildTransform(
  vals: ReturnType<typeof resolveAnimateValues>,
  perspective: number | false,
): string {
  const parts: string[] = [];
  if (perspective !== false) {
    parts.push(`perspective(${perspective}px)`);
  }
  if (vals.translateX !== 0 || vals.translateY !== 0) {
    parts.push(`translate(${vals.translateX}px, ${vals.translateY}px)`);
  }
  if (vals.scaleX !== 1 || vals.scaleY !== 1) {
    parts.push(
      vals.scaleX === vals.scaleY
        ? `scale(${vals.scaleX})`
        : `scale(${vals.scaleX}, ${vals.scaleY})`,
    );
  }
  if (vals.rotate !== 0) {
    parts.push(`rotate(${vals.rotate}deg)`);
  }
  if (vals.rotateX !== 0) {
    parts.push(`rotateX(${vals.rotateX}deg)`);
  }
  if (vals.rotateY !== 0) {
    parts.push(`rotateY(${vals.rotateY}deg)`);
  }
  return parts.length > 0 ? parts.join(' ') : 'none';
}

/** Returns true if the transition is a SingleTransition (has a `type` field). */
function isSingleTransition(t: Transition): t is SingleTransition {
  return 'type' in t;
}

/** Resolve a single config into CSS-ready duration/easing. */
function resolveConfigForCss(config: SingleTransition | undefined): {
  duration: number;
  easing: string;
  type: string;
} {
  if (!config || config.type === 'none') {
    return { duration: 0, easing: 'linear', type: config?.type ?? 'timing' };
  }
  return {
    duration: resolveDuration(config),
    easing: resolveEasing(config),
    type: config.type,
  };
}

/** CSS property names for each category. */
const CSS_PROP_MAP = {
  opacity: 'opacity',
  transform: 'transform',
  borderRadius: 'border-radius',
  backgroundColor: 'background-color',
  borderWidth: 'border-width',
  borderColor: 'border-color',
  boxShadow: 'box-shadow',
} as const;

type CategoryKey = keyof typeof CSS_PROP_MAP;

/** Resolve transition prop into per-category CSS configs. */
function resolvePerCategoryConfigs(
  transition: Transition | undefined,
): Record<CategoryKey, { duration: number; easing: string; type: string }> {
  if (!transition) {
    const def = resolveConfigForCss(undefined);
    return {
      opacity: def,
      transform: def,
      borderRadius: def,
      backgroundColor: def,
      borderWidth: def,
      borderColor: def,
      boxShadow: def,
    };
  }
  if (isSingleTransition(transition)) {
    const def = resolveConfigForCss(transition);
    return {
      opacity: def,
      transform: def,
      borderRadius: def,
      backgroundColor: def,
      borderWidth: def,
      borderColor: def,
      boxShadow: def,
    };
  }
  // TransitionMap
  const defaultConfig = resolveConfigForCss(transition.default);
  const borderConfig = transition.border
    ? resolveConfigForCss(transition.border)
    : defaultConfig;
  const shadowConfig = transition.shadow
    ? resolveConfigForCss(transition.shadow)
    : defaultConfig;
  return {
    opacity: transition.opacity
      ? resolveConfigForCss(transition.opacity)
      : defaultConfig,
    transform: transition.transform
      ? resolveConfigForCss(transition.transform)
      : defaultConfig,
    borderRadius: transition.borderRadius
      ? resolveConfigForCss(transition.borderRadius)
      : defaultConfig,
    backgroundColor: transition.backgroundColor
      ? resolveConfigForCss(transition.backgroundColor)
      : defaultConfig,
    borderWidth: borderConfig,
    borderColor: borderConfig,
    boxShadow: shadowConfig,
  };
}

function resolveEasing(transition: SingleTransition | undefined): string {
  if (!transition || transition.type === 'none') {
    return 'linear';
  }
  if (transition.type === 'spring') {
    const d = transition.damping ?? 15;
    const s = transition.stiffness ?? 120;
    const m = transition.mass ?? 1;
    // `velocity` is not applied here: the easing is a single normalized 0->1
    // curve shared by every property in the category, while an initial velocity
    // only has meaning relative to each property's own from->to distance.
    if (supportsLinearEasing()) {
      return getSpringEasing(d, s, m).easing;
    }
    return SPRING_FALLBACK_EASING;
  }
  // timing
  const easing = transition.easing ?? 'easeInOut';
  const bezier: CubicBezier = Array.isArray(easing)
    ? easing
    : EASING_PRESETS[easing]!;
  return `cubic-bezier(${bezier[0]}, ${bezier[1]}, ${bezier[2]}, ${bezier[3]})`;
}

function resolveDuration(transition: SingleTransition | undefined): number {
  if (!transition) return 300;
  if (transition.type === 'timing') return transition.duration ?? 300;
  if (transition.type === 'none') return 0;
  // Spring: use simulation-derived duration (incorporates stiffness)
  const d = transition.damping ?? 15;
  const s = transition.stiffness ?? 120;
  const m = transition.mass ?? 1;
  return getSpringEasing(d, s, m).duration;
}

/** Counter for unique keyframe names. */
let keyframeCounter = 0;

export function EaseView({
  animate,
  initialAnimate,
  transition,
  onTransitionEnd,
  useHardwareLayer: _useHardwareLayer,
  transformOrigin,
  transformPerspective = 1280,
  style,
  children,
}: EaseViewProps) {
  const resolved = resolveAnimateValues(animate);

  const uses3D =
    animate?.rotateX != null ||
    animate?.rotateY != null ||
    initialAnimate?.rotateX != null ||
    initialAnimate?.rotateY != null;

  const hasInitial = initialAnimate != null;
  const [mounted, setMounted] = useState(!hasInitial);
  // On web, View ref gives us the underlying DOM element.
  const viewRef = useRef<React.ComponentRef<typeof View>>(null);
  const animationNameRef = useRef<string | null>(null);

  const getElement = useCallback(
    () => viewRef.current as unknown as HTMLElement | null,
    [],
  );

  // For initialAnimate: render initial values first, then animate on mount.
  useEffect(() => {
    if (hasInitial) {
      getElement()?.getBoundingClientRect();
      setMounted(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayValues =
    !mounted && hasInitial ? resolveAnimateValues(initialAnimate) : resolved;

  const categoryConfigs = resolvePerCategoryConfigs(transition);

  // For loop mode, use the default/single transition config
  const singleTransition =
    transition && isSingleTransition(transition)
      ? transition
      : transition && !isSingleTransition(transition)
      ? transition.default
      : undefined;
  const loopMode =
    singleTransition?.type === 'timing' ? singleTransition.loop : undefined;
  const loopDuration = resolveDuration(singleTransition);
  const loopEasing = resolveEasing(singleTransition);

  const originX = ((transformOrigin?.x ?? 0.5) * 100).toFixed(1);
  const originY = ((transformOrigin?.y ?? 0.5) * 100).toFixed(1);

  const transitionCss =
    !mounted && hasInitial
      ? 'none'
      : (Object.keys(CSS_PROP_MAP) as CategoryKey[])
          .filter((key) => {
            const cfg = categoryConfigs[key];
            return cfg.type !== 'none' && cfg.duration > 0;
          })
          .map((key) => {
            const cfg = categoryConfigs[key];
            return `${CSS_PROP_MAP[key]} ${cfg.duration}ms ${cfg.easing}`;
          })
          .join(', ') || 'none';

  // Apply CSS transition/animation properties imperatively (not in RN style spec).
  useEffect(() => {
    const el = getElement();
    if (!el) return;

    if (!loopMode) {
      el.style.transition = transitionCss;
    }
    el.style.transformOrigin = `${originX}% ${originY}%`;
  });

  // Handle transitionend event via DOM listener.
  useEffect(() => {
    const el = getElement();
    if (!el || !onTransitionEnd) return;

    const handler = (e: TransitionEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform')
        return;
      onTransitionEnd({ finished: true });
    };

    el.addEventListener('transitionend', handler);
    return () => el.removeEventListener('transitionend', handler);
  }, [onTransitionEnd, getElement]);

  // Handle loop animations via CSS @keyframes.
  useEffect(() => {
    const el = getElement();
    if (!loopMode || !el) {
      if (animationNameRef.current) {
        const cleanEl = getElement();
        if (cleanEl) cleanEl.style.animation = '';
        animationNameRef.current = null;
      }
      return;
    }

    const fromValues = initialAnimate
      ? resolveAnimateValues(initialAnimate)
      : resolveAnimateValues(undefined);
    const toValues = resolveAnimateValues(animate);

    const fromTransform = buildTransform(
      fromValues,
      uses3D && transformPerspective,
    );
    const toTransform = buildTransform(
      toValues,
      uses3D && transformPerspective,
    );

    const name = `ease-loop-${++keyframeCounter}`;
    animationNameRef.current = name;

    // Only include border-radius/background-color in keyframes when explicitly
    // set by the user, to avoid overriding values from the style prop.
    const hasBorderRadius =
      initialAnimate?.borderRadius != null || animate?.borderRadius != null;
    const hasBgColor =
      initialAnimate?.backgroundColor != null ||
      animate?.backgroundColor != null;

    const fromBlock = [
      `opacity: ${fromValues.opacity}`,
      `transform: ${fromTransform}`,
      hasBorderRadius ? `border-radius: ${fromValues.borderRadius}px` : '',
      hasBgColor && fromValues.backgroundColor
        ? `background-color: ${fromValues.backgroundColor}`
        : '',
    ]
      .filter(Boolean)
      .join('; ');

    const toBlock = [
      `opacity: ${toValues.opacity}`,
      `transform: ${toTransform}`,
      hasBorderRadius ? `border-radius: ${toValues.borderRadius}px` : '',
      hasBgColor && toValues.backgroundColor
        ? `background-color: ${toValues.backgroundColor}`
        : '',
    ]
      .filter(Boolean)
      .join('; ');

    const keyframes = `@keyframes ${name} { from { ${fromBlock} } to { ${toBlock} } }`;

    const styleEl = document.createElement('style');
    styleEl.textContent = keyframes;
    document.head.appendChild(styleEl);

    const direction = loopMode === 'reverse' ? 'alternate' : 'normal';
    el.style.transition = 'none';
    el.style.animation = `${name} ${loopDuration}ms ${loopEasing} infinite ${direction}`;

    return () => {
      styleEl.remove();
      el.style.animation = '';
      animationNameRef.current = null;
    };
  }, [
    loopMode,
    animate,
    initialAnimate,
    loopDuration,
    loopEasing,
    getElement,
    uses3D,
    transformPerspective,
  ]);

  // Build animated style using RN transform array format.
  // react-native-web converts these to CSS transform strings.
  const animatedStyle: ViewStyle = {
    opacity: displayValues.opacity,
    transform: [
      ...(uses3D ? [{ perspective: transformPerspective }] : []),
      ...(displayValues.translateX !== 0
        ? [{ translateX: displayValues.translateX }]
        : []),
      ...(displayValues.translateY !== 0
        ? [{ translateY: displayValues.translateY }]
        : []),
      ...(displayValues.scaleX !== 1 ? [{ scaleX: displayValues.scaleX }] : []),
      ...(displayValues.scaleY !== 1 ? [{ scaleY: displayValues.scaleY }] : []),
      ...(displayValues.rotate !== 0
        ? [{ rotate: `${displayValues.rotate}deg` }]
        : []),
      ...(uses3D ? [{ rotateX: `${displayValues.rotateX}deg` }] : []),
      ...(uses3D ? [{ rotateY: `${displayValues.rotateY}deg` }] : []),
    ],
    ...(displayValues.borderRadius > 0
      ? { borderRadius: displayValues.borderRadius }
      : {}),
    ...(displayValues.backgroundColor
      ? { backgroundColor: displayValues.backgroundColor }
      : {}),
    ...(displayValues.borderWidth > 0
      ? { borderWidth: displayValues.borderWidth }
      : {}),
    ...(displayValues.borderColor
      ? { borderColor: displayValues.borderColor }
      : {}),
    ...(displayValues.shadowOpacity > 0
      ? {
          shadowColor: displayValues.shadowColor ?? 'black',
          shadowOpacity: displayValues.shadowOpacity,
          shadowRadius: displayValues.shadowRadius,
          shadowOffset: displayValues.shadowOffset,
        }
      : {}),
  };

  return (
    <View ref={viewRef} style={[style, animatedStyle]}>
      {children}
    </View>
  );
}
