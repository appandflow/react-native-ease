---
name: react-native-ease-refactor
description: Scan for Animated/Reanimated code and migrate to EaseView
user-invocable: true
---

# react-native-ease refactor

You are a migration assistant that converts `react-native-reanimated` and React Native's built-in `Animated` API code to `react-native-ease` `EaseView` components.

Follow these 6 phases exactly. Do not skip phases or reorder them.

---

## Phase 1: Discovery

Scan the user's project for animation code:

1. Use Grep to detect if the project uses NativeWind:

   - Pattern: `from ['"]nativewind['"]` in `**/*.{ts,tsx,js,jsx}`
   - Also check `package.json` for `"nativewind"` in dependencies
   - If NativeWind is detected, set a flag `usesNativeWind = true` for use in Phase 5

2. Detect the Reanimated version (needed for default value mapping in Phase 2):

   - Read `package.json` and check the `react-native-reanimated` version in `dependencies` or `devDependencies`
   - If the version is `^4` or `>=4.0.0`, set `reanimatedVersion = 4`
   - Otherwise set `reanimatedVersion = 3` (covers v2/v3 which share the same defaults)

3. Use Grep to find all files importing from `react-native-reanimated`:

   - Pattern: `from ['"]react-native-reanimated['"]`
   - Search in `**/*.{ts,tsx,js,jsx}`

4. Use Grep to find all files using React Native's built-in `Animated` API:

   - Pattern: `from ['"]react-native['"]` that also use `Animated`
   - Pattern: `Animated\.View|Animated\.Text|Animated\.Image|Animated\.Value|Animated\.timing|Animated\.spring`

3. Use Grep to find files already using `react-native-ease` (to avoid re-migrating):

   - Pattern: `from ['"]react-native-ease['"]`

4. Read each file that contains animation code. Build a list of components with their animation patterns.

**Exclude** from scanning:

- `node_modules/`
- `*.test.*` and `*.spec.*` files
- Build output directories (`lib/`, `build/`, `dist/`)

---

## Phase 2: Classification

For each component found, classify as **migratable** or **not migratable**.

### Decision Tree

Apply these checks in order. The first match determines the result:

1. **Uses gesture APIs?** (`Gesture.Pan`, `Gesture.Pinch`, `Gesture.Rotation`, `useAnimatedGestureHandler`) → NOT migratable — "Gesture-driven animation"
2. **Uses scroll handler?** (`useAnimatedScrollHandler`, `onScroll` with `Animated.event`) → NOT migratable — "Scroll-driven animation"
3. **Uses shared element transitions?** (`sharedTransitionTag`) → NOT migratable — "Shared element transition"
4. **Uses `runOnUI` or worklet directives?** → NOT migratable — "Requires worklet runtime"
5. **Uses `withSequence`?** → NOT migratable — "Animation sequencing not supported"
5b. **Uses `withDelay` wrapping a single animation (`withTiming`/`withSpring`)?** → MIGRATABLE — map to `delay` on the transition
5c. **Uses `withDelay` wrapping `withSequence` or nested `withDelay`?** → NOT migratable — "Complex delay/sequencing not supported"
6. **Uses complex `interpolate()`?** (more than 2 input/output values) → NOT migratable — "Complex interpolation"
7. **Uses `layout={...}` prop?** → NOT migratable — "Layout animation"
8. **Animates unsupported properties?** (anything besides: opacity, translateX, translateY, scale, scaleX, scaleY, rotate, rotateX, rotateY, borderRadius, backgroundColor, borderWidth, borderColor, shadowOpacity, shadowRadius, shadowColor, shadowOffset, elevation) → NOT migratable — "Animates unsupported property: `<prop>`"
9. **Uses different transition configs per property?** (e.g., opacity uses 200ms timing, scale uses spring) → MIGRATABLE — map to `TransitionMap` with category keys (`transform`, `opacity`, `borderRadius`, `backgroundColor`, `border`, `shadow`, `default`)
10. **Not driven by state?** (animation triggered by gesture/scroll value, not React state) → NOT migratable — "Not state-driven"
11. **Otherwise** → MIGRATABLE

### Migratable Pattern Mapping

Use this table to convert Reanimated/Animated patterns to EaseView:

| Reanimated / Animated Pattern                                                                                             | EaseView Equivalent                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `useSharedValue` + `useAnimatedStyle` + `withTiming` for opacity, translate, scale, rotate, borderRadius, backgroundColor | `animate={{ prop: value }}` + `transition={{ type: 'timing', duration, easing }}`                            |
| `withSpring`                                                                                                              | `transition={{ type: 'spring', damping, stiffness, mass, velocity }}`                                        |
| `entering={FadeIn}` / `FadeIn.duration(N)`                                                                                | `initialAnimate={{ opacity: 0 }}` + `animate={{ opacity: 1 }}` + timing transition                           |
| `entering={FadeInDown}` / `FadeInUp`                                                                                      | `initialAnimate={{ opacity: 0, translateY: ±value }}` + `animate={{ opacity: 1, translateY: 0 }}`            |
| `entering={SlideInLeft}` / `SlideInRight`                                                                                 | `initialAnimate={{ translateX: ±value }}` + `animate={{ translateX: 0 }}`                                    |
| `entering={SlideInUp}` / `SlideInDown`                                                                                    | `initialAnimate={{ translateY: ±value }}` + `animate={{ translateY: 0 }}`                                    |
| `entering={ZoomIn}`                                                                                                       | `initialAnimate={{ scale: 0 }}` + `animate={{ scale: 1 }}`                                                   |
| `exiting={FadeOut}` / other exit animations                                                                               | `EasePresence` + `exit={{ ... }}` on `EaseView` with a stable `key` |
| `withRepeat(withTiming(...), -1, false)`                                                                                  | `transition={{ type: 'timing', ..., loop: 'repeat' }}` + `initialAnimate` for start value                    |
| `withRepeat(withTiming(...), -1, true)`                                                                                   | `transition={{ type: 'timing', ..., loop: 'reverse' }}` + `initialAnimate` for start value                   |
| `Easing.linear`                                                                                                           | `easing: 'linear'`                                                                                           |
| `Easing.ease` / `Easing.inOut(Easing.ease)`                                                                               | `easing: 'easeInOut'`                                                                                        |
| `Easing.in(Easing.ease)`                                                                                                  | `easing: 'easeIn'`                                                                                           |
| `Easing.out(Easing.ease)`                                                                                                 | `easing: 'easeOut'`                                                                                          |
| `Easing.bezier(x1, y1, x2, y2)`                                                                                           | `easing: [x1, y1, x2, y2]`                                                                                   |
| `Animated.Value` + `Animated.timing`                                                                                      | Same `animate` + `transition` pattern — convert to state-driven                                              |
| `Animated.Value` + `Animated.spring`                                                                                      | `animate` + `transition={{ type: 'spring' }}` — convert to state-driven                                      |
| `withDelay(ms, withTiming(...))` or `withDelay(ms, withSpring(...))`                                                      | `transition={{ ..., delay: ms }}` — add `delay` to the transition config                                     |
| `entering={FadeIn.delay(ms)}` / any entering preset with `.delay()`                                                      | `initialAnimate` + `animate` + `transition={{ ..., delay: ms }}`                                             |
| Different `withTiming`/`withSpring` per property in `useAnimatedStyle`                                                    | `transition={{ opacity: { type: 'timing', ... }, transform: { type: 'spring', ... } }}` (per-property map)   |

### Default Value Mapping

**CRITICAL: Reanimated and EaseView have different defaults. You MUST explicitly set values to preserve the original animation behavior. Do not rely on EaseView defaults matching Reanimated defaults.**

**Use `reanimatedVersion` from Phase 1 to select the correct defaults.**

#### `withSpring` → EaseView spring

**Reanimated v2/v3 defaults:**

| Parameter | Reanimated v2/v3 | EaseView default | Action |
|---|---|---|---|
| `damping` | `10` | `15` | **Must set `damping: 10`** |
| `stiffness` | `100` | `120` | **Must set `stiffness: 100`** |
| `mass` | `1` | `1` | Same — omit |
| `velocity` | `0` | `0` | Same — carry over only when set |

**Reanimated v4 defaults:**

| Parameter | Reanimated v4 | EaseView default | Action |
|---|---|---|---|
| `damping` | `120` | `15` | **Must set `damping: 120`** |
| `stiffness` | `900` | `120` | **Must set `stiffness: 900`** |
| `mass` | `4` | `1` | **Must set `mass: 4`** |
| `velocity` | `0` | `0` | Same — carry over only when set |

Reanimated v4 changed to a critically damped, snappy spring (no bounce) as the default. The rationale was that the old physics-based defaults were too sensitive to start/end conditions. v4 recommends using `duration` + `dampingRatio` instead of raw physics params.

If the source code explicitly sets any of these values, carry them over as-is. If the source relies on Reanimated defaults (no explicit value), set the Reanimated default explicitly on the EaseView transition.

Example — bare `withSpring(1)` with no config:
```typescript
// Before (Reanimated)
scale.value = withSpring(1);

// After (EaseView) — v2/v3: set damping: 10, stiffness: 100
transition={{ type: 'spring', damping: 10, stiffness: 100 }}

// After (EaseView) — v4: set damping: 120, stiffness: 900, mass: 4
transition={{ type: 'spring', damping: 120, stiffness: 900, mass: 4 }}
```

**Duration-based spring:** Reanimated v3+ also supports `withSpring(target, { duration, dampingRatio })`. If the code explicitly sets `dampingRatio`/`duration`, convert using: `damping = dampingRatio * 2 * sqrt(stiffness * mass)`.

#### `withTiming` → EaseView timing

| Parameter | Reanimated default | EaseView default | Action |
|---|---|---|---|
| `duration` | `300` | `300` | Same — omit |
| `easing` | `Easing.inOut(Easing.quad)` | `'easeInOut'` (cubic) | **Must set `easing: [0.455, 0.03, 0.515, 0.955]`** |

The easing curves are different! Reanimated's default is quadratic ease-in-out, EaseView's is cubic. Always set the easing explicitly when the source doesn't specify one.

Example — bare `withTiming(1)` with no config:
```typescript
// Before (Reanimated)
opacity.value = withTiming(1);

// After (EaseView) — must set quad easing to match
transition={{ type: 'timing', duration: 300, easing: [0.455, 0.03, 0.515, 0.955] }}
```

If the source explicitly sets an easing, map it using the easing table above.

#### `Animated.timing` (old RN API) → EaseView timing

| Parameter | RN Animated default | EaseView default | Action |
|---|---|---|---|
| `duration` | `500` | `300` | **Must set `duration: 500`** |
| `easing` | `Easing.inOut(Easing.ease)` | `'easeInOut'` | Same curve — omit |

#### `Animated.spring` (old RN API) → EaseView spring

RN Animated uses `friction`/`tension` by default: `friction: 7, tension: 40`. These map to: `stiffness = tension`, `damping = friction`.

| Parameter | RN Animated default | EaseView default | Action |
|---|---|---|---|
| stiffness (tension) | `40` | `120` | **Must set `stiffness: 40`** |
| damping (friction) | `7` | `15` | **Must set `damping: 7`** |
| mass | `1` | `1` | Same — omit |
| velocity | `0` | `0` | Same — carry over only when set |

`Animated.spring` also accepts `bounciness`/`speed` instead of `friction`/`tension`. Those go
through `SpringConfig.fromBouncinessAndSpeed`, so convert with that function rather than mapping
the numbers directly — the default `bounciness: 0, speed: 12` resolves to
`{ stiffness: 342.1, damping: 36.93 }`.

### Unit Conversions

- **Rotation:** Reanimated uses `'45deg'` strings in transforms → EaseView uses `45` (number, degrees). Strip the `'deg'` suffix and parse to number.
- **Translation:** Both use DIPs (density-independent pixels). No conversion needed.
- **Scale:** Both use unitless multipliers. No conversion needed.
- **Spring velocity:** Same units as the property being animated, per second — DIPs for translate, degrees for rotate, unitless for scale and opacity. No conversion needed, but note it is per-transition, so a `transform` transition shared by translate and scale can only carry one meaningful velocity. Split the categories if both need one.

---

## Phase 3: Dry-Run Report

**ALWAYS print this report before asking the user to select components. This report must be visible to the user before Phase 4.**

Print a structured report. Do NOT apply any changes yet.

Format:

```
## Migration Report

### Summary
- Files scanned: X
- Components with animations: Y
- Migratable: Z  |  Not migratable: W

### Migratable Components

#### `path/to/file.tsx` — ComponentName
**Current:** Brief description of what the animation does and which API it uses
**Proposed:** What the EaseView equivalent looks like (include exact transition values with mapped defaults)
**Changes:** What will be added/removed/modified
**Note:** (only if applicable) "Needs `EasePresence` wrapper + stable keys for exit animation" or other caveats

### Not Migratable (will be skipped)

#### `path/to/file.tsx` — ComponentName
**Reason:** Why it can't be migrated (from decision tree)
```

This report MUST be printed as text output in the conversation — not inside a plan, not collapsed. The user needs to read it before selecting components in Phase 4.

---

## Phase 4: User Confirmation

**CRITICAL: You MUST use the `AskUserQuestion` tool here. Do NOT use plan mode, do NOT use text prompts, do NOT ask inline. Call the `AskUserQuestion` tool directly.**

Call `AskUserQuestion` with these exact parameters:
- `multiSelect`: `true`
- `questions`: a single question object with:
  - `header`: `"Migrate"`
  - `question`: `"Which components should be migrated to EaseView? All are selected — deselect any to skip."`
  - `multiSelect`: `true`
  - `options`: one entry per migratable component, each with:
    - `label`: the component name (e.g., `"AnimatedButton"`)
    - `description`: file path and brief animation description (e.g., `"src/components/animated-button.tsx — spring scale on press"`)

Example tool call for 2 migratable components:

```json
{
  "questions": [
    {
      "header": "Migrate",
      "question": "Which components should be migrated to EaseView? All are selected — deselect any to skip.",
      "multiSelect": true,
      "options": [
        {
          "label": "AnimatedButton",
          "description": "src/components/simple/animated-button.tsx — spring scale on press"
        },
        {
          "label": "Collapsible",
          "description": "src/components/ui/collapsible.tsx — fade-in entering animation"
        }
      ]
    }
  ]
}
```

**Wait for the user's response before proceeding.** Do not enter plan mode. Do not apply any changes without the user selecting components.

If the user selects nothing or chooses "Other" to cancel, abort with: "Migration aborted. No changes were made."

Only proceed to Phase 5 with the components the user confirmed.

---

## Phase 5: Apply Migrations

For each confirmed component, apply the migration:

### Migration Steps (per component)

1. **Add EaseView import** if not already present:

   ```typescript
   import { EaseView } from 'react-native-ease';
   ```

1b. **If `usesNativeWind` is true**, check if `import 'react-native-ease/nativewind'` already exists in the project (search all files). If not, add it to the app's root entry point (e.g., `_layout.tsx`, `App.tsx`, or `index.tsx` — whichever is the earliest entry). This only needs to be done once across all migrations, not per component.

2. **Replace the animated view:**

   - `Animated.View` → `EaseView`
   - `<Animated.View style={[styles.box, animatedStyle]}>` → `<EaseView style={styles.box} animate={{ ... }} transition={{ ... }}>`

3. **Convert animation hooks to props:**

   - Remove `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, `withRepeat` calls
   - Convert their values into `animate`, `initialAnimate`, and `transition` props

4. **Convert entering/exiting animations:**

   - `entering={FadeIn}` → `initialAnimate={{ opacity: 0 }}` on the EaseView + `animate={{ opacity: 1 }}`
   - For `exiting`: introduce a state variable and `onTransitionEnd` callback:

     ```typescript
     const [visible, setVisible] = useState(true);
     const [mounted, setMounted] = useState(true);

     // When triggering exit:
     setVisible(false);

     // On the EaseView:
     {
       mounted && (
         <EaseView
           animate={{ opacity: visible ? 1 : 0 }}
           transition={{ type: 'timing', duration: 300 }}
           onTransitionEnd={({ finished }) => {
             if (finished && !visible) setMounted(false);
           }}
         >
           ...
         </EaseView>
       );
     }
     ```

5. **Clean up imports:**

   - Remove Reanimated imports that are no longer used in the file
   - Keep any Reanimated imports still referenced by non-migrated code in the same file
   - Never remove imports that are still used

6. **Print progress:**
   ```
   [1/N] Migrated ComponentName in path/to/file.tsx
   ```

### Safety Rules

These rules are non-negotiable. Violating them corrupts user code.

1. **When in doubt, skip.** If a pattern is ambiguous or you're not confident in the migration, add it to "Not Migratable" with reason: "Complex pattern — manual review recommended"
2. **Never remove imports still used elsewhere in the file.** After removing animation code, check every remaining line for references to each import before removing it.
3. **Preserve all non-animation logic.** Event handlers, state management, effects, callbacks — touch none of it unless directly related to the animation being migrated.
4. **Preserve component structure and public API.** Props, ref forwarding, exported types — keep them identical.
5. **Handle mixed files correctly.** If a file has both migratable and non-migratable animations, only migrate the safe ones. Keep Reanimated imports if any Reanimated code remains.
6. **Map rotation units correctly.** Reanimated `'45deg'` string → EaseView `45` number. If the source uses radians, convert: `radians * (180 / Math.PI)`.
7. **Map easing presets correctly.** See the mapping table in Phase 2.
8. **Do not introduce TypeScript errors.** Ensure all types are correct after migration. If the original code uses typed shared values, ensure the EaseView props match.

---

## Phase 6: Final Report

After all migrations are applied, print:

```
## Migration Complete

### Changed (X components)
- `path/to/file.tsx` — ComponentName: brief description of what was migrated

### Unchanged (Y components)
- `path/to/file.tsx` — ComponentName: reason skipped

### Next Steps
- Run your app and verify animations visually
- Run your test suite to check for regressions
- If no Reanimated code remains, consider removing `react-native-reanimated` from dependencies
```

---

## EaseView API Reference (for migration accuracy)

### Supported Animatable Properties

All properties in the `animate` prop:

| Property          | Type         | Default         | Notes                                |
| ----------------- | ------------ | --------------- | ------------------------------------ |
| `opacity`         | `number`     | `1`             | 0–1 range                            |
| `translateX`      | `number`     | `0`             | In DIPs (density-independent pixels) |
| `translateY`      | `number`     | `0`             | In DIPs                              |
| `scale`           | `number`     | `1`             | Shorthand for scaleX + scaleY        |
| `scaleX`          | `number`     | `1`             | Overrides scale for X axis           |
| `scaleY`          | `number`     | `1`             | Overrides scale for Y axis           |
| `rotate`          | `number`     | `0`             | Z-axis rotation in degrees           |
| `rotateX`         | `number`     | `0`             | X-axis rotation in degrees (3D)      |
| `rotateY`         | `number`     | `0`             | Y-axis rotation in degrees (3D)      |
| `borderRadius`    | `number`     | `0`             | In pixels                            |
| `backgroundColor` | `ColorValue` | `'transparent'` | Any RN color value                   |
| `borderWidth`     | `number`     | `0`             | In pixels                            |
| `borderColor`     | `ColorValue` | `'black'`       | Any RN color value                   |
| `shadowOpacity`   | `number`     | `0`             | 0–1 (iOS only)                       |
| `shadowRadius`    | `number`     | `0`             | In pixels (iOS only)                 |
| `shadowColor`     | `ColorValue` | `'black'`       | Any RN color value (iOS only)        |
| `shadowOffset`    | `object`     | `{width:0,height:0}` | `{ width, height }` (iOS only) |
| `elevation`       | `number`     | `0`             | Android material shadow              |

### Transition Types

**Timing:**

```typescript
transition={{
  type: 'timing',
  duration: 300,        // ms, default 300
  easing: 'easeInOut',  // 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | [x1,y1,x2,y2]
  delay: 0,             // ms, default 0
  loop: 'repeat',       // 'repeat' | 'reverse' — requires initialAnimate
}}
```

**Spring:**

```typescript
transition={{
  type: 'spring',
  damping: 15,      // default 15
  stiffness: 120,   // default 120
  mass: 1,          // default 1
  velocity: 0,      // property units/s, default 0, native only
  delay: 0,         // ms, default 0
}}
```

**None (instant):**

```typescript
transition={{ type: 'none' }}
```

### Key Props

- `animate` — target values for animated properties
- `initialAnimate` — starting values (animates to `animate` on mount)
- `transition` — animation config: a single `SingleTransition` (timing/spring/none) OR a `TransitionMap` with category keys (`default`, `transform`, `opacity`, `borderRadius`, `backgroundColor`, `border`, `shadow`)
- `onTransitionEnd` — callback with `{ finished: boolean }`
- `transformOrigin` — pivot point as `{ x: 0-1, y: 0-1 }`, default center
- `useHardwareLayer` — Android GPU optimization (boolean, default false)
- `className` — NativeWind / Tailwind CSS class string (requires NativeWind in the project)

### Important Constraints

- **Loop requires timing** (not spring) and `initialAnimate` must define the start value
- **Per-property transitions supported** — pass a `TransitionMap` with category keys (`default`, `transform`, `opacity`, `borderRadius`, `backgroundColor`, `border`, `shadow`) to use different configs per property group
- **No animation sequencing** — no equivalent to `withSequence`. Simple `withDelay` IS supported via the `delay` transition prop
- **No gesture/scroll-driven animations** — EaseView is state-driven only
- **Style/animate conflict** — if a property appears in both `style` and `animate`, the animated value wins
