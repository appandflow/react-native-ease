import {
  Children,
  cloneElement,
  isValidElement,
  type Key,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AnimateProps, Transition, TransitionEndEvent } from './types';
import type { EaseViewProps } from './EaseView';

type PresenceItem = {
  key: string;
  element: ReactElement<EaseViewProps>;
  isExiting: boolean;
  exitVersion: number;
};

export type EasePresenceProps = {
  children: ReactNode;
};

function normalizeKey(key: Key | null): string {
  return key == null ? '__ease_presence_no_key__' : String(key);
}

function hasLoopingTransition(transition?: Transition): boolean {
  if (!transition) return false;

  const isLoopingTiming = (value: Transition | undefined) =>
    value != null &&
    'type' in value &&
    value.type === 'timing' &&
    (value.loop === 'repeat' || value.loop === 'reverse');

  if (isLoopingTiming(transition)) {
    return true;
  }

  if (!('type' in transition)) {
    return (
      isLoopingTiming(transition.default) ||
      isLoopingTiming(transition.transform) ||
      isLoopingTiming(transition.opacity) ||
      isLoopingTiming(transition.borderRadius) ||
      isLoopingTiming(transition.backgroundColor) ||
      isLoopingTiming(transition.border) ||
      isLoopingTiming(transition.shadow)
    );
  }

  return false;
}

function toEaseElements(children: ReactNode): ReactElement<EaseViewProps>[] {
  return Children.toArray(children).filter(
    (child: ReactNode): child is ReactElement<EaseViewProps> =>
      isValidElement<EaseViewProps>(child),
  );
}

function warnForMissingKeys(children: ReactNode): void {
  if (!__DEV__) return;

  Children.forEach(children, (child: ReactNode) => {
    if (isValidElement(child) && child.key == null) {
      console.warn(
        'react-native-ease: EasePresence requires stable keys on children to run exit animations.',
      );
    }
  });
}

export function EasePresence({ children }: EasePresenceProps) {
  const childElements = useMemo(() => toEaseElements(children), [children]);

  const [items, setItems] = useState<PresenceItem[]>(() =>
    childElements.map((element) => ({
      key: normalizeKey(element.key),
      element,
      isExiting: false,
      exitVersion: 0,
    })),
  );

  useEffect(() => {
    warnForMissingKeys(children);

    setItems((prev: PresenceItem[]) => {
      const incomingByKey = new Map<string, ReactElement<EaseViewProps>>();
      const incomingOrder: string[] = [];

      for (const element of childElements) {
        const key = normalizeKey(element.key);
        incomingByKey.set(key, element);
        incomingOrder.push(key);
      }

      const prevByKey = new Map<string, PresenceItem>(
        prev.map((item: PresenceItem) => [item.key, item]),
      );
      const next: PresenceItem[] = [];

      for (const key of incomingOrder) {
        const nextElement = incomingByKey.get(key)!;
        const existing = prevByKey.get(key);
        if (existing) {
          next.push({
            key,
            element: nextElement,
            isExiting: false,
            exitVersion: existing.exitVersion,
          });
        } else {
          next.push({
            key,
            element: nextElement,
            isExiting: false,
            exitVersion: 0,
          });
        }
      }

      for (const oldItem of prev) {
        if (incomingByKey.has(oldItem.key)) {
          continue;
        }

        if (oldItem.isExiting) {
          next.push(oldItem);
          continue;
        }

        const exit = oldItem.element.props.exit;
        if (!exit) {
          continue;
        }

        if (hasLoopingTransition(oldItem.element.props.transition)) {
          if (__DEV__) {
            console.warn(
              'react-native-ease: EasePresence ignores exit animation when transition.loop is repeat/reverse. Remove loop on exiting views.',
            );
          }
          continue;
        }

        next.push({
          ...oldItem,
          isExiting: true,
          exitVersion: oldItem.exitVersion + 1,
        });
      }

      return next;
    });
  }, [childElements, children]);

  return (
    <>
      {items.map((item: PresenceItem) => {
        if (!item.isExiting) {
          return item.element;
        }

        const exitAnimate: AnimateProps | undefined = item.element.props.exit;
        if (!exitAnimate) {
          return item.element;
        }

        const originalOnTransitionEnd = item.element.props.onTransitionEnd;
        const exitingKey = item.key;
        const exitingVersion = item.exitVersion;

        return cloneElement(item.element, {
          animate: exitAnimate,
          onTransitionEnd: (event: TransitionEndEvent) => {
            originalOnTransitionEnd?.(event);
            if (!event.finished) {
              return;
            }
            setItems((current: PresenceItem[]) =>
              current.filter(
                (candidate: PresenceItem) =>
                  !(
                    candidate.key === exitingKey &&
                    candidate.isExiting &&
                    candidate.exitVersion === exitingVersion
                  ),
              ),
            );
          },
        });
      })}
    </>
  );
}
