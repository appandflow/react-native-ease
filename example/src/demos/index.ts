import type { ComponentType } from 'react';
import { Platform } from 'react-native';

import { BackgroundColorDemo } from './BackgroundColorDemo';
import { BenchmarkDemo } from './BenchmarkDemo';
import { BannerDemo } from './BannerDemo';
import { CardFlipDemo } from './CardFlipDemo';
import { BorderDemo } from './BorderDemo';
import { BorderRadiusDemo } from './BorderRadiusDemo';
import { ButtonDemo } from './ButtonDemo';
import { CombinedDemo } from './CombinedDemo';
import { ComparisonDemo } from './ComparisonDemo';
import { CustomEasingDemo } from './CustomEasingDemo';
import { DelayDemo } from './DelayDemo';
import { EnterDemo } from './EnterDemo';
import { ExitDemo } from './ExitDemo';
import { FadeDemo } from './FadeDemo';
import { InterruptDemo } from './InterruptDemo';
import { KitchenSinkDemo } from './KitchenSinkDemo';
import { PulseDemo } from './PulseDemo';
import { RotateDemo } from './RotateDemo';
import { ScaleDemo } from './ScaleDemo';
import { SlideDemo } from './SlideDemo';
import { StyleReRenderDemo } from './StyleReRenderDemo';
import { StyledCardDemo } from './StyledCardDemo';
import { TransformOriginDemo } from './TransformOriginDemo';
import { PerPropertyDemo } from './PerPropertyDemo';
import { ShadowDemo } from './ShadowDemo';
import { SpinDemo } from './SpinDemo';
import { SpringVelocityDemo } from './SpringVelocityDemo';
import { UniwindDemo } from './uniwind/UniwindDemo';

interface DemoEntry {
  /** Component rendered inside the catch-all `[demo].tsx` screen. */
  component?: ComponentType;
  /**
   * Custom expo-router path. Used by issue reproducers that need their own
   * layout (tabs, modals, etc.) under `app/issues/...`. When omitted, the
   * registry key is used as a single-segment route handled by `[demo].tsx`.
   */
  route?: string;
  title: string;
  section: string;
}

export const demos: Record<string, DemoEntry> = {
  'button': { component: ButtonDemo, title: 'Button', section: 'Basic' },
  'fade': { component: FadeDemo, title: 'Fade', section: 'Basic' },
  'slide': { component: SlideDemo, title: 'Slide', section: 'Basic' },
  'enter': { component: EnterDemo, title: 'Enter', section: 'Basic' },
  'exit': { component: ExitDemo, title: 'Exit', section: 'Basic' },
  'rotate': { component: RotateDemo, title: 'Rotate', section: 'Transform' },
  'scale': { component: ScaleDemo, title: 'Scale', section: 'Transform' },
  'card-flip': {
    component: CardFlipDemo,
    title: 'Card Flip',
    section: 'Transform',
  },
  'transform-origin': {
    component: TransformOriginDemo,
    title: 'Transform Origin',
    section: 'Transform',
  },
  'custom-easing': {
    component: CustomEasingDemo,
    title: 'Custom Easing',
    section: 'Timing',
  },
  'delay': { component: DelayDemo, title: 'Delay', section: 'Timing' },
  'spring-velocity': {
    component: SpringVelocityDemo,
    title: 'Spring Velocity',
    section: 'Timing',
  },
  'combined': { component: CombinedDemo, title: 'Combined', section: 'Timing' },
  'styled-card': {
    component: StyledCardDemo,
    title: 'Styled Card',
    section: 'Style',
  },
  'border': {
    component: BorderDemo,
    title: 'Border',
    section: 'Style',
  },
  'border-radius': {
    component: BorderRadiusDemo,
    title: 'Border Radius',
    section: 'Style',
  },
  'background-color': {
    component: BackgroundColorDemo,
    title: 'Background Color',
    section: 'Style',
  },
  'shadow': {
    component: ShadowDemo,
    title: 'Shadow',
    section: 'Style',
  },
  'style-rerender': {
    component: StyleReRenderDemo,
    title: 'Style Re-Render',
    section: 'Style',
  },
  'uniwind': {
    component: UniwindDemo,
    title: 'Uniwind',
    section: 'Style',
  },
  'spin': { component: SpinDemo, title: 'Spin', section: 'Loop' },
  'pulse': { component: PulseDemo, title: 'Pulse', section: 'Loop' },
  'banner': { component: BannerDemo, title: 'Banner', section: 'Loop' },
  'interrupt': {
    component: InterruptDemo,
    title: 'Interrupt',
    section: 'Advanced',
  },
  'comparison': {
    component: ComparisonDemo,
    title: 'Comparison',
    section: 'Advanced',
  },
  'per-property': {
    component: PerPropertyDemo,
    title: 'Per-Property',
    section: 'Advanced',
  },
  'kitchen-sink': {
    component: KitchenSinkDemo,
    title: 'Kitchen Sink',
    section: 'Advanced',
  },
  ...(Platform.OS !== 'web'
    ? {
        benchmark: {
          component: BenchmarkDemo,
          title: 'Benchmark',
          section: 'Advanced',
        },
      }
    : {}),
  // --- Issue reproducers ---
  // Each entry routes to its own layout under `app/issues/<n>/`. Add a new
  // reproducer when fixing a bug so we can test for regressions.
  'issue-42': {
    route: '/issues/42',
    title: 'Issue #42 — Tabs loop',
    section: 'Issues',
  },
  'issue-45': {
    route: '/issues/45',
    title: 'Issue #45 — Android modal background',
    section: 'Issues',
  },
  'issue-54': {
    route: '/issues/54',
    title: 'Issue #54 — Stale shimmer loop',
    section: 'Issues',
  },
  'issue-loop-cancel': {
    route: '/issues/loop-cancel',
    title: 'Audit — Cancelled loop resurrects',
    section: 'Issues',
  },
};

interface SectionData {
  title: string;
  data: { key: string; title: string; route: string }[];
}

export type TabKey = 'api' | 'demos' | 'issues';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'api', label: 'API' },
  { key: 'demos', label: 'Demos' },
  { key: 'issues', label: 'Issues' },
];

// Section → top-level tab. API covers building-block primitives, Demos covers
// compound showcase screens, Issues covers regression reproducers.
const sectionToTab: Record<string, TabKey> = {
  Basic: 'api',
  Transform: 'api',
  Timing: 'api',
  Style: 'api',
  Loop: 'api',
  Advanced: 'demos',
  Issues: 'issues',
};

const sectionOrder = [
  'Basic',
  'Transform',
  'Timing',
  'Style',
  'Loop',
  'Advanced',
  'Issues',
];

export function getDemoSections(tab: TabKey): SectionData[] {
  const grouped = new Map<
    string,
    { key: string; title: string; route: string }[]
  >();

  for (const [key, entry] of Object.entries(demos)) {
    if (sectionToTab[entry.section] !== tab) continue;
    const list = grouped.get(entry.section) ?? [];
    list.push({ key, title: entry.title, route: entry.route ?? `/${key}` });
    grouped.set(entry.section, list);
  }

  return sectionOrder
    .filter((s) => grouped.has(s))
    .map((s) => ({ title: s, data: grouped.get(s)! }));
}
