<img width="100%" height="auto" alt="react-native-ease by App & Flow" src="https://github.com/user-attachments/assets/8006ed51-d373-4c97-9e80-9937eb9a569e" />

Lightweight declarative animations powered by platform APIs. Uses Core Animation on iOS and Animator on Android — zero JS overhead.

## About
App & Flow is a Montreal-based React Native engineering and consulting studio. We partner with the world’s top companies and are recommended by [Expo](https://expo.dev/consultants). Need a hand? Let’s build together. team@appandflow.com

## Demo

![ease-demo](https://github.com/user-attachments/assets/09658b07-803e-4b7e-a23c-831a6c63df84)

## Getting started

### Installation

```bash
npm install react-native-ease
# or
yarn add react-native-ease
```

### Migration Skill

If you're already using `react-native-reanimated` or React Native's `Animated` API, this project includes an [Agent Skill](https://agentskills.io) that scans your codebase for animations that can be replaced with `react-native-ease` and migrates them automatically.

```bash
npx skills add appandflow/react-native-ease
```

Then invoke the skill in your agent (e.g., `/react-native-ease-refactor` in Claude Code).

The skill will:

1. Scan your project for Reanimated/Animated code
2. Classify which animations can be migrated (and which can't, with reasons)
3. Show a migration report with before/after details
4. Let you select which components to migrate
5. Apply the changes, preserving all non-animation logic

### NativeWind Support

If you're using [NativeWind](https://www.nativewind.dev/) (v4+), add this import once in your app's entry point (e.g., `_layout.tsx` or `App.tsx`):

```tsx
import 'react-native-ease/nativewind';
```

This registers `EaseView` with NativeWind's `cssInterop` so `className` is properly converted to styles:

```tsx
<EaseView
  className="flex-1 bg-white rounded-2xl p-4"
  animate={{ opacity: visible ? 1 : 0 }}
  transition={{ type: 'timing', duration: 300 }}
>
  {children}
</EaseView>
```

> **Tip:** If you use the [migration skill](#migration-skill), it detects NativeWind automatically and adds this import for you.

### Uniwind Support

If you're using [Uniwind](https://docs.uniwind.dev/), first follow the
[Uniwind quickstart](https://docs.uniwind.dev/quickstart) to install and
configure Uniwind in your app. That setup includes the required CSS entry file,
app-root CSS import, and bundler configuration.

Once Uniwind is set up, import `EaseView` from the Uniwind entry point:

```tsx
import { EaseView } from 'react-native-ease/uniwind';
```

This wraps `EaseView` with Uniwind's `withUniwind(...)` so `className` is converted to styles:

```tsx
<EaseView
  className="flex-1 bg-white rounded-2xl p-4"
  animate={{ opacity: visible ? 1 : 0 }}
  transition={{ type: 'timing', duration: 300 }}
>
  {children}
</EaseView>
```

### Example

```tsx
import { EaseView } from 'react-native-ease';

function FadeCard({ visible, children }) {
  return (
    <EaseView
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.card}
    >
      {children}
    </EaseView>
  );
}
```

`EaseView` works like a regular `View` — it accepts children, styles, and all standard view props. When values in `animate` change, it smoothly transitions to the new values using native platform animations.

For unmount/exit animations, wrap keyed children in `EasePresence` and provide `exit` on `EaseView`.

## Why

### Goals

- **Fast** — Animations run entirely on native platform APIs (CAAnimation, ObjectAnimator/SpringAnimation). No JS animation loop, no worklets, no shared values.
- **Simple** — CSS-transition-like API. Set target values, get smooth animations. One component, a few props.
- **Lightweight** — Minimal native code, no C++ runtime, no custom animation engine. Just a thin declarative wrapper around what the OS already provides.
- **Interruptible** — Changing values mid-animation smoothly redirects to the new target. No jumps.

### Non-Goals

- **Complex gesture-driven animations** — If you need pan/pinch-driven animations, animation worklets, or shared values across components, use [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated).
- **Layout animations** — Animating width/height/layout changes is not supported.
- **Shared element transitions** — Use Reanimated or React Navigation's shared element transitions.
- **Old architecture** — Fabric (new architecture) only.

### When to use this vs Reanimated

| Use case                               | Ease | Reanimated |
| -------------------------------------- | ---- | ---------- |
| Fade/slide/scale on state change       | ✅   |            |
| Enter/exit animations                  | ✅   |            |
| Gesture-driven animations (pan, pinch) |      | ✅         |
| Layout animations (width, height)      |      | ✅         |
| Complex interpolations & chaining      |      | ✅         |

## Guide

### Timing Animations

Timing animations transition from one value to another over a fixed duration with an easing curve.

```tsx
<EaseView
  animate={{ opacity: isVisible ? 1 : 0 }}
  transition={{ type: 'timing', duration: 300, easing: 'easeOut' }}
/>
```

| Parameter  | Type         | Default       | Description                                                              |
| ---------- | ------------ | ------------- | ------------------------------------------------------------------------ |
| `duration` | `number`     | `300`         | Duration in milliseconds                                                 |
| `easing`   | `EasingType` | `'easeInOut'` | Easing curve (preset name or `[x1, y1, x2, y2]` cubic bezier)            |
| `delay`    | `number`     | `0`           | Delay in milliseconds before the animation starts                        |
| `loop`     | `string`     | —             | `'repeat'` restarts from the beginning, `'reverse'` alternates direction |

Available easing curves:

- `'linear'` — constant speed
- `'easeIn'` — starts slow, accelerates
- `'easeOut'` — starts fast, decelerates
- `'easeInOut'` — slow start and end, fast middle
- `[x1, y1, x2, y2]` — custom cubic bezier (same as CSS `cubic-bezier()`)

### Custom Easing

Pass a `[x1, y1, x2, y2]` tuple for custom cubic bezier curves. The values correspond to the two control points of the bezier curve, matching the CSS `cubic-bezier()` function.

```tsx
// Standard Material Design easing
<EaseView
  animate={{ opacity: isVisible ? 1 : 0 }}
  transition={{ type: 'timing', duration: 300, easing: [0.4, 0, 0.2, 1] }}
/>

// Overshoot (y-values can exceed 0–1)
<EaseView
  animate={{ scale: active ? 1.2 : 1 }}
  transition={{ type: 'timing', duration: 500, easing: [0.68, -0.55, 0.265, 1.55] }}
/>
```

x-values (x1, x2) must be between 0 and 1. y-values can exceed this range to create overshoot effects.

### Spring Animations

Spring animations use a physics-based model for natural-feeling motion. Great for interactive elements.

```tsx
<EaseView
  animate={{ translateX: isOpen ? 200 : 0 }}
  transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
/>
```

| Parameter   | Type     | Default | Description                                                   |
| ----------- | -------- | ------- | ------------------------------------------------------------- |
| `damping`   | `number` | `15`    | Friction — higher values reduce oscillation                   |
| `stiffness` | `number` | `120`   | Spring constant — higher values mean faster animation         |
| `mass`      | `number` | `1`     | Mass of the object — higher values mean slower, more momentum |
| `velocity`  | `number` | `0`     | Initial velocity in property units per second (native only)   |
| `delay`     | `number` | `0`     | Delay in milliseconds before the animation starts             |

`velocity` gives the spring a head start, the way `Animated.spring`'s `velocity` does — useful
when the animation continues a gesture that was already moving. It is signed in value space, so a
positive value means the property is already increasing:

```tsx
<EaseView
  animate={{ translateY: dismissed ? 400 : 0 }}
  transition={{ type: 'spring', damping: 18, stiffness: 200, velocity: 1200 }}
/>
```

Units follow the JS side — DIPs per second for `translateX`/`translateY`, degrees per second for
`rotate`, and plain units per second for `scale` and `opacity`. It has no effect on web, where a
spring compiles to a single normalized CSS easing curve that cannot express a per-property
starting velocity.

Spring presets for common feels:

```tsx
// Snappy (no bounce)
{ type: 'spring', damping: 20, stiffness: 300, mass: 1 }

// Gentle bounce
{ type: 'spring', damping: 12, stiffness: 120, mass: 1 }

// Bouncy
{ type: 'spring', damping: 8, stiffness: 200, mass: 1 }

// Slow and heavy
{ type: 'spring', damping: 20, stiffness: 60, mass: 2 }
```

### Disabling Animations

Use `{ type: 'none' }` to apply values immediately without animation. Useful for skipping animations in reduced-motion modes or when you need an instant state change.

```tsx
<EaseView
  animate={{ opacity: isVisible ? 1 : 0 }}
  transition={{ type: 'none' }}
/>
```

`onTransitionEnd` fires immediately with `{ finished: true }`.

### Per-Property Transitions

Pass a map instead of a single config to use different animation types per property category.

```tsx
<EaseView
  animate={{ opacity: visible ? 1 : 0, translateY: visible ? 0 : 30 }}
  transition={{
    opacity: { type: 'timing', duration: 150, easing: 'easeOut' },
    transform: { type: 'spring', damping: 12, stiffness: 200 },
  }}
/>
```

Available category keys:

| Key               | Properties                                                       |
| ----------------- | ---------------------------------------------------------------- |
| `default`         | Fallback for categories not explicitly listed                    |
| `transform`       | translateX, translateY, scaleX, scaleY, rotate, rotateX, rotateY |
| `opacity`         | opacity                                                          |
| `borderRadius`    | borderRadius                                                     |
| `backgroundColor` | backgroundColor                                                  |
| `border`          | borderWidth, borderColor                                         |
| `shadow`          | shadowOpacity, shadowRadius, shadowColor, shadowOffset, elevation |

Use `default` as a fallback for categories not explicitly listed:

```tsx
<EaseView
  animate={{ opacity: 1, scale: 1.2, translateY: -20 }}
  transition={{
    default: { type: 'spring', damping: 15, stiffness: 120 },
    opacity: { type: 'timing', duration: 200, easing: 'easeOut' },
  }}
/>
```

When no `default` key is provided, the library default (timing 300ms easeInOut) applies to all categories.

> **Android note:** Android animates `backgroundColor` with `ValueAnimator` (timing only). If a per-property map specifies `type: 'spring'` for `backgroundColor`, it silently falls back to timing 300ms.

### Border Radius

`borderRadius` can be animated just like other properties. It uses hardware-accelerated platform APIs — `ViewOutlineProvider` + `clipToOutline` on Android and `layer.cornerRadius` on iOS.

```tsx
<EaseView
  animate={{ borderRadius: expanded ? 0 : 16 }}
  transition={{ type: 'timing', duration: 300 }}
  style={styles.card}
>
  <Image source={heroImage} style={styles.image} />
  <Text>Content is clipped to rounded corners</Text>
</EaseView>
```

When `borderRadius` is in `animate`, any `borderRadius` in `style` is automatically stripped to avoid conflicts.

### Background Color

`backgroundColor` can be animated using any React Native color value. Colors are converted to native ARGB integers via `processColor()`.

```tsx
<EaseView
  animate={{ backgroundColor: isActive ? '#3B82F6' : '#E5E7EB' }}
  transition={{ type: 'timing', duration: 300 }}
  style={styles.card}
>
  <Text>Tap to change color</Text>
</EaseView>
```

On Android, background color uses `ValueAnimator.ofArgb()` (timing only — spring is not supported for colors). On iOS, it uses `CAAnimation` on the `backgroundColor` layer key path and supports both timing and spring transitions.

> **Note:** On Android, background color animation uses `ValueAnimator.ofArgb()` which only supports timing transitions. Spring transitions for `backgroundColor` are not supported on Android and will fall back to timing with the default duration. On iOS, both timing and spring transitions work for background color.

When `backgroundColor` is in `animate`, any `backgroundColor` in `style` is automatically stripped to avoid conflicts.

### Border

`borderWidth` and `borderColor` can be animated. On iOS, these use Core Animation on the `CALayer` border properties. On Android, they use `BackgroundStyleApplicator` which updates the `BorderDrawable` each frame.

```tsx
<EaseView
  animate={{
    borderWidth: selected ? 3 : 0,
    borderColor: selected ? '#3B82F6' : '#E5E7EB',
  }}
  transition={{ border: { type: 'spring', damping: 15, stiffness: 120 } }}
  style={styles.card}
/>
```

### Shadow / Elevation

Shadow properties are iOS-only (`shadowOpacity`, `shadowRadius`, `shadowColor`, `shadowOffset`). On Android, use `elevation` for material shadows.

```tsx
<EaseView
  animate={{
    shadowOpacity: active ? 0.4 : 0,
    shadowRadius: active ? 16 : 0,
    shadowOffset: active ? { width: 0, height: 8 } : { width: 0, height: 0 },
    elevation: active ? 12 : 0,
  }}
  transition={{ shadow: { type: 'spring', damping: 15, stiffness: 120 } }}
  style={{ shadowColor: '#000', backgroundColor: '#fff', borderRadius: 16 }}
/>
```

### Animatable Properties

All properties are set in the `animate` prop as flat values (no transform array).

```tsx
<EaseView
  animate={{
    opacity: 1, // 0 to 1
    translateX: 0, // pixels
    translateY: 0, // pixels
    scale: 1, // 1 = normal size (shorthand for scaleX + scaleY)
    scaleX: 1, // horizontal scale
    scaleY: 1, // vertical scale
    rotate: 0, // Z-axis rotation in degrees
    rotateX: 0, // X-axis rotation in degrees (3D)
    rotateY: 0, // Y-axis rotation in degrees (3D)
    borderRadius: 0, // pixels (hardware-accelerated)
    backgroundColor: 'transparent', // any RN color value
    borderWidth: 0, // pixels
    borderColor: 'black', // any RN color value
    shadowOpacity: 0, // 0–1 (iOS only)
    shadowRadius: 0, // pixels (iOS only)
    shadowColor: 'black', // any RN color value (iOS only)
    shadowOffset: { width: 0, height: 0 }, // iOS only
    elevation: 0, // Android material shadow
  }}
/>
```

`scale` is a shorthand that sets both `scaleX` and `scaleY`. When `scaleX` or `scaleY` is also specified, it overrides the `scale` value for that axis.

You can animate any combination of properties simultaneously. Use a single transition config for all properties, or a [per-property map](#per-property-transitions) for different configs per category.

### Looping Animations

Timing animations can loop infinitely. Use `'repeat'` to restart from the beginning or `'reverse'` to alternate direction.

```tsx
// Pulsing opacity
<EaseView
  initialAnimate={{ opacity: 0.3 }}
  animate={{ opacity: 1 }}
  transition={{ type: 'timing', duration: 1000, easing: 'easeInOut', loop: 'reverse' }}
/>

// Marquee-style scroll
<EaseView
  initialAnimate={{ translateX: 0 }}
  animate={{ translateX: -300 }}
  transition={{ type: 'timing', duration: 3000, easing: 'linear', loop: 'repeat' }}
/>
```

Loop requires `initialAnimate` to define the starting value. Spring animations do not support looping.

### Enter Animations

Use `initialAnimate` to set starting values. On mount, the view starts at `initialAnimate` values and animates to `animate` values.

```tsx
// Fade in and slide up on mount
<EaseView
  initialAnimate={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
/>
```

Without `initialAnimate`, the view renders at the `animate` values immediately with no animation on mount.

### Exit Animations

Use `EasePresence` + `exit` to animate before unmount. `EasePresence` keeps removed keyed children mounted until `onTransitionEnd({ finished: true })`.

```tsx
import { EasePresence, EaseView } from 'react-native-ease';

<EasePresence>
  {visible ? (
    <EaseView
      key="toast"
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 12 }}
      transition={{ type: 'timing', duration: 220, easing: 'easeOut' }}
    />
  ) : null}
</EasePresence>
```

Notes:

- Child elements must have stable keys.
- Avoid `transition.loop` on exiting views (`repeat`/`reverse` never complete).

### Delay

Use `delay` to postpone the start of an animation. This is useful for staggering enter animations across multiple elements.

```tsx
// Staggered fade-in list
{items.map((item, i) => (
  <EaseView
    key={item.id}
    initialAnimate={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 300, delay: i * 100 }}
  >
    <Text>{item.label}</Text>
  </EaseView>
))}
```

`delay` works with both timing and spring transitions.

### Interruption

Animations are interruptible by default. If you change `animate` values while an animation is running, it smoothly redirects to the new target from wherever it currently is — no jumping or restarting.

```tsx
// Rapidly toggling this is fine — each toggle smoothly
// redirects the animation from its current position
<EaseView
  animate={{ translateX: isLeft ? 0 : 200 }}
  transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
/>
```

### Transform Origin

By default, scale and rotation animate from the view's center. Use `transformOrigin` to change the pivot point with 0–1 fractions.

```tsx
// Rotate from top-left corner
<EaseView
  animate={{ rotate: isOpen ? 45 : 0 }}
  transformOrigin={{ x: 0, y: 0 }}
  transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
  style={styles.card}
/>

// Scale from bottom-right
<EaseView
  animate={{ scale: active ? 1.2 : 1 }}
  transformOrigin={{ x: 1, y: 1 }}
  transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
  style={styles.card}
/>
```

| Value                | Position         |
| -------------------- | ---------------- |
| `{ x: 0, y: 0 }`     | Top-left         |
| `{ x: 0.5, y: 0.5 }` | Center (default) |
| `{ x: 1, y: 1 }`     | Bottom-right     |

### Transform Perspective

Control the 3D perspective depth for `rotateX` and `rotateY` animations. Lower values create a more dramatic 3D effect; higher values look flatter.

```tsx
<EaseView
  animate={{ rotateY: flipped ? 180 : 0 }}
  transformPerspective={800}
  transition={{ type: 'timing', duration: 600, easing: 'easeInOut' }}
  style={styles.card}
/>
```

Default is `1280`, matching React Native's default perspective.

> **iOS note:** On iOS, the parent view must not be flattened by Fabric for perspective to render correctly. Ensure the parent has `collapsable={false}` or a style that prevents flattening (e.g. `transform`, `opacity`, `zIndex`).

### Style Handling

`EaseView` accepts all standard `ViewStyle` properties. If a property appears in both `style` and `animate`, the animated value takes priority and the style value is stripped. A dev warning is logged when this happens.

```tsx
// opacity in style works because only translateY is animated
<EaseView
  animate={{ translateY: moved ? -10 : 0 }}
  transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
  style={{
    opacity: 0.9,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  }}
>
  <Text>Notification card</Text>
</EaseView>

// ⚠️ opacity is in both — animate wins, style opacity is stripped, dev warning logged
<EaseView
  animate={{ opacity: 1 }}
  style={{ opacity: 0.5, backgroundColor: 'white' }}
/>
```

## API Reference

### `<EaseView>`

A `View` that animates property changes using native platform APIs.

| Prop               | Type                         | Description                                                                                                                  |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `animate`          | `AnimateProps`               | Target values for animated properties                                                                                        |
| `initialAnimate`   | `AnimateProps`               | Starting values for enter animations (animates to `animate` on mount)                                                        |
| `transition`       | `Transition`                 | Animation configuration — a single config (timing, spring, or none) or a [per-property map](#per-property-transitions)        |
| `onTransitionEnd`  | `(event) => void`            | Called when all animations complete with `{ finished: boolean }`                                                             |
| `transformOrigin`  | `{ x?: number; y?: number }` | Pivot point for scale/rotation as 0–1 fractions. Default: `{ x: 0.5, y: 0.5 }` (center)                                      |
| `transformPerspective` | `number`                 | Camera distance for 3D transforms (`rotateX`, `rotateY`). See [Transform Perspective](#transform-perspective). Default: `1280` |
| `useHardwareLayer` | `boolean`                    | Android only — rasterize to GPU texture during animations. See [Hardware Layers](#hardware-layers-android). Default: `false` |
| `className`        | `string`                     | NativeWind / Uniwind / Tailwind CSS class string. Requires NativeWind or Uniwind in your project.                            |
| `style`            | `ViewStyle`                  | Non-animated styles (layout, colors, borders, etc.)                                                                          |
| `children`         | `ReactNode`                  | Child elements                                                                                                               |
| ...rest            | `ViewProps`                  | All other standard View props                                                                                                |

### `AnimateProps`

| Property          | Type         | Default         | Description                                                                          |
| ----------------- | ------------ | --------------- | ------------------------------------------------------------------------------------ |
| `opacity`         | `number`     | `1`             | View opacity (0–1)                                                                   |
| `translateX`      | `number`     | `0`             | Horizontal translation in pixels                                                     |
| `translateY`      | `number`     | `0`             | Vertical translation in pixels                                                       |
| `scale`           | `number`     | `1`             | Uniform scale factor (shorthand for `scaleX` + `scaleY`)                             |
| `scaleX`          | `number`     | `1`             | Horizontal scale factor (overrides `scale` for X axis)                               |
| `scaleY`          | `number`     | `1`             | Vertical scale factor (overrides `scale` for Y axis)                                 |
| `rotate`          | `number`     | `0`             | Z-axis rotation in degrees                                                           |
| `rotateX`         | `number`     | `0`             | X-axis rotation in degrees (3D)                                                      |
| `rotateY`         | `number`     | `0`             | Y-axis rotation in degrees (3D)                                                      |
| `borderRadius`    | `number`     | `0`             | Border radius in pixels (hardware-accelerated)                                       |
| `backgroundColor` | `ColorValue` | `'transparent'` | Background color (any RN color value). Timing-only on Android, spring+timing on iOS. |
| `borderWidth`     | `number`     | `0`             | Border width in pixels                                                               |
| `borderColor`     | `ColorValue` | `'black'`       | Border color                                                                         |
| `shadowOpacity`   | `number`     | `0`             | Shadow opacity 0–1 (iOS only)                                                        |
| `shadowRadius`    | `number`     | `0`             | Shadow blur radius (iOS only)                                                        |
| `shadowColor`     | `ColorValue` | `'black'`       | Shadow color (iOS only)                                                              |
| `shadowOffset`    | `object`     | `{width:0,height:0}` | Shadow offset `{ width, height }` (iOS only)                                   |
| `elevation`       | `number`     | `0`             | Material shadow elevation (Android only)                                             |

Properties not specified in `animate` default to their identity values.

### `TimingTransition`

```tsx
{
  type: 'timing';
  duration?: number;  // default: 300 (ms)
  easing?: EasingType;  // default: 'easeInOut' — preset name or [x1, y1, x2, y2]
  delay?: number;  // default: 0 (ms)
  loop?: 'repeat' | 'reverse';  // default: none
}
```

### `SpringTransition`

```tsx
{
  type: 'spring';
  damping?: number;    // default: 15
  stiffness?: number;  // default: 120
  mass?: number;       // default: 1
  velocity?: number;   // default: 0 (property units/s, native only)
  delay?: number;      // default: 0 (ms)
}
```

### `NoneTransition`

```tsx
{
  type: 'none';
}
```

Applies values instantly with no animation. `onTransitionEnd` fires immediately with `{ finished: true }`.

### `TransitionMap`

A per-property map that applies different transition configs to different property categories. See [Per-Property Transitions](#per-property-transitions).

| Key               | Properties                                                       |
| ----------------- | ---------------------------------------------------------------- |
| `default`         | Fallback for categories not explicitly listed                    |
| `transform`       | translateX, translateY, scaleX, scaleY, rotate, rotateX, rotateY |
| `opacity`         | opacity                                                          |
| `borderRadius`    | borderRadius                                                     |
| `backgroundColor` | backgroundColor                                                  |
| `border`          | borderWidth, borderColor                                         |
| `shadow`          | shadowOpacity, shadowRadius, shadowColor, shadowOffset, elevation |

## Hardware Layers (Android)

Setting `useHardwareLayer` rasterizes the view into a GPU texture for the duration of the animation. This means animated property changes (opacity, scale, rotation) are composited on the RenderThread without redrawing the view hierarchy — useful for complex views with many children.

```tsx
<EaseView animate={{ opacity: isVisible ? 1 : 0 }} useHardwareLayer />
```

**Trade-offs:**

- Faster rendering for opacity, scale, and rotation animations (RenderThread compositing).
- Uses additional GPU memory for the off-screen texture (proportional to view size).
- Children that overflow the view's layout bounds are **clipped** by the texture. This causes visual artifacts when animating `translateX`/`translateY` on views with overflowing content.

No-op on iOS where Core Animation already composites off the main thread.

## Benchmarks

The example app includes a benchmark that measures per-frame animation overhead across different approaches. All approaches run the same animation (translateX loop, linear, 2s) on a configurable number of views.

### Android (release build, emulator, M4 MacBook Pro)

UI thread time per frame: anim + layout + draw (ms). Lower is better.

![Android benchmark](https://github.com/user-attachments/assets/f0e5cf26-76be-4dd3-ae04-e17c6d13b49c)

<details>
<summary>Detailed numbers</summary>

| Views | Metric | Ease | Reanimated SV | Reanimated SV (FF) | Reanimated CSS | Reanimated CSS (FF) | RN Animated |
|-------|--------|------|---------------|---------------------|----------------|----------------------|-------------|
| 10 | Avg | 0.21 | 1.15 | 0.75 | 0.99 | 0.45 | 0.36 |
| 10 | P95 | 0.33 | 1.70 | 1.53 | 1.44 | 0.80 | 0.62 |
| 10 | P99 | 0.48 | 1.94 | 2.26 | 1.62 | 1.35 | 0.98 |
| 100 | Avg | 0.36 | 2.71 | 1.81 | 2.19 | 1.01 | 0.71 |
| 100 | P95 | 0.56 | 3.09 | 2.29 | 2.67 | 1.91 | 1.08 |
| 100 | P99 | 0.71 | 3.20 | 2.63 | 2.97 | 2.25 | 1.36 |
| 500 | Avg | 0.60 | 8.31 | 5.37 | 5.50 | 2.37 | 1.60 |
| 500 | P95 | 0.75 | 9.26 | 6.36 | 6.34 | 2.86 | 1.88 |
| 500 | P99 | 0.87 | 9.59 | 6.89 | 6.88 | 3.22 | 3.84 |

</details>

### iOS (release build, simulator, iPhone 16 Pro, M4 MacBook Pro)

Display link callback time per frame (ms). Lower is better.

![iOS benchmark](https://github.com/user-attachments/assets/c39a7a71-bf21-4276-b02f-b29983989832)

<details>
<summary>Detailed numbers</summary>

| Views | Metric | Ease | Reanimated SV | Reanimated SV (FF) | Reanimated CSS | Reanimated CSS (FF) | RN Animated |
|-------|--------|------|---------------|---------------------|----------------|----------------------|-------------|
| 10 | Avg | 0.01 | 1.33 | 1.08 | 1.06 | 0.63 | 0.83 |
| 10 | P95 | 0.02 | 1.67 | 1.59 | 1.34 | 1.01 | 1.18 |
| 10 | P99 | 0.03 | 1.90 | 1.68 | 1.50 | 1.08 | 1.31 |
| 100 | Avg | 0.01 | 3.72 | 3.33 | 2.71 | 2.48 | 3.32 |
| 100 | P95 | 0.01 | 5.21 | 4.50 | 3.83 | 3.39 | 4.28 |
| 100 | P99 | 0.02 | 5.68 | 4.75 | 4.91 | 3.79 | 4.55 |
| 500 | Avg | 0.01 | 6.84 | 6.54 | 4.16 | 3.70 | 4.91 |
| 500 | P95 | 0.01 | 7.69 | 7.32 | 4.59 | 4.22 | 5.66 |
| 500 | P99 | 0.02 | 8.10 | 7.45 | 4.71 | 4.33 | 5.89 |

</details>

Ease stays near zero because animations run entirely on platform APIs. On iOS, Core Animation runs on a separate render server process off the main thread, which is why Ease shows ~0ms. On Android, ObjectAnimator runs on the UI thread but is significantly lighter than other approaches. Reanimated results shown with experimental [feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/) OFF (default) and ON (FF). Run the benchmark yourself in the [example app](example/).

## How It Works

`EaseView` is a native Fabric component. The JS side flattens your `animate` and `transition` props into flat native props. When those props change, the native view:

1. **Diffs** previous vs new values to find what changed
2. **Reads** the current in-flight value (for smooth interruption)
3. **Creates** a platform-native animation from the current value to the new target
4. **Sets** the final value immediately on the model layer

On iOS, this uses `CABasicAnimation`/`CASpringAnimation` on `CALayer` key paths. On Android, this uses `ObjectAnimator`/`SpringAnimation` on `View` properties. No JS thread involvement during the animation.

## Requirements

- React Native 0.76+ (new architecture / Fabric)
- iOS 15.1+
- Android minSdk 24+

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
