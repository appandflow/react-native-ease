import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
  type HostComponent,
  type ColorValue,
} from 'react-native';

type Float = CodegenTypes.Float;
type Int32 = CodegenTypes.Int32;

type NativeTransitionConfig = Readonly<{
  type: string;
  duration: Int32;
  easingBezier: ReadonlyArray<Float>;
  damping: Float;
  stiffness: Float;
  mass: Float;
  velocity: Float;
  loop: string;
  delay: Int32;
}>;

type NativeTransitions = Readonly<{
  defaultConfig: NativeTransitionConfig;
  transform?: NativeTransitionConfig;
  opacity?: NativeTransitionConfig;
  borderRadius?: NativeTransitionConfig;
  backgroundColor?: NativeTransitionConfig;
  border?: NativeTransitionConfig;
  shadow?: NativeTransitionConfig;
}>;

type NativePausedEvent = Readonly<{
  opacity: Float;
  translateX: Float;
  translateY: Float;
  scaleX: Float;
  scaleY: Float;
  rotate: Float;
  rotateX: Float;
  rotateY: Float;
  borderRadius: Float;
  backgroundColor: Int32;
  borderWidth: Float;
  borderColor: Int32;
  shadowOpacity: Float;
  shadowRadius: Float;
  shadowColor: Int32;
  shadowOffsetX: Float;
  shadowOffsetY: Float;
  elevation: Float;
}>;

export interface NativeProps extends ViewProps {
  // Bitmask of which properties are animated (0 = none, let style handle all)
  animatedProperties?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;

  // Animate target values
  animateOpacity?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateTranslateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateTranslateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateScaleX?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateScaleY?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateRotate?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateRotateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateRotateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateBorderRadius?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateBackgroundColor?: ColorValue;
  animateBorderWidth?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateBorderColor?: ColorValue;
  animateShadowOpacity?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateShadowRadius?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateShadowColor?: ColorValue;
  animateShadowOffsetX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateShadowOffsetY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateElevation?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;

  // Initial values for enter animations
  initialAnimateOpacity?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateTranslateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateTranslateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateScaleX?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateScaleY?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateRotate?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateRotateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateRotateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateBorderRadius?: CodegenTypes.WithDefault<
    CodegenTypes.Float,
    0.0
  >;
  initialAnimateBackgroundColor?: ColorValue;
  initialAnimateBorderWidth?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateBorderColor?: ColorValue;
  initialAnimateShadowOpacity?: CodegenTypes.WithDefault<
    CodegenTypes.Float,
    0.0
  >;
  initialAnimateShadowRadius?: CodegenTypes.WithDefault<
    CodegenTypes.Float,
    0.0
  >;
  initialAnimateShadowColor?: ColorValue;
  initialAnimateShadowOffsetX?: CodegenTypes.WithDefault<
    CodegenTypes.Float,
    0.0
  >;
  initialAnimateShadowOffsetY?: CodegenTypes.WithDefault<
    CodegenTypes.Float,
    0.0
  >;
  initialAnimateElevation?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;

  // Unified transition config — one struct with per-property configs
  transitions?: NativeTransitions;

  // Transform origin (0–1 fractions, default center)
  transformOriginX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.5>;
  transformOriginY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.5>;

  // 3D perspective distance (default 1280, matches RN default)
  transformPerspective?: CodegenTypes.WithDefault<CodegenTypes.Float, 1280.0>;

  paused?: CodegenTypes.WithDefault<boolean, false>;

  // Events
  onTransitionEnd?: CodegenTypes.DirectEventHandler<
    Readonly<{ finished: boolean }>
  >;
  // Colors are ARGB integers
  onPaused?: CodegenTypes.DirectEventHandler<NativePausedEvent>;

  // Android hardware layer optimization (no-op on iOS)
  useHardwareLayer?: CodegenTypes.WithDefault<boolean, false>;
}

export default codegenNativeComponent<NativeProps>(
  'EaseView',
) as HostComponent<NativeProps>;
