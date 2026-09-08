import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease';

// Issue #54 — a looping animation survives on an EaseView whose current props
// no longer ask for it.
// https://github.com/appandflow/react-native-ease/issues/54
//
// Both cards below keep the SAME EaseView instance across the load — no key,
// no remount — which is what a list row does when it swaps a skeleton for its
// loaded content. The teardown paths in updateProps are gated on "property is
// still in animatedProperties AND its value changed", so neither card hits
// them and the shimmer keeps sweeping over the content.
//
// Steps to reproduce:
// 1. Both cards shimmer — a band sweeps left→right on a 1.5 s linear loop.
// 2. Press "Load content". Both cards swap to their loaded state.
// 3. Expected: both bands stop.
//    Without the fix: both keep sweeping forever.
// 4. Switch to the Other tab and back. Without the fix the loops are replayed
//    by didMoveToWindow → reapplyLoopAnimations even after being cancelled.
// 5. "Back to skeleton" remounts both views to start the shimmer over.

const SWEEP = 64;

export default function StaleLoopTab() {
  const insets = useSafeAreaInsets();
  const [loaded, setLoaded] = useState(false);
  // Loops are only created on first mount, so resetting has to remount the
  // views. Loading must NOT — the bug needs the same EaseView instance.
  const [mountKey, setMountKey] = useState(0);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Issue #54 — stale shimmer loop</Text>
      <Text style={styles.body}>
        Press Load content. Both bands must stop sweeping. Then switch to the
        Other tab and back — they must still be stopped.
      </Text>

      <Card
        title="A — property leaves animate"
        detail={
          loaded
            ? 'animate={{ opacity: 1 }} · mask no longer has translateX'
            : 'animate={{ translateX: 64 }} · loop: repeat'
        }
      >
        <EaseView
          key={mountKey}
          initialAnimate={loaded ? undefined : { translateX: -SWEEP }}
          animate={loaded ? { opacity: 1 } : { translateX: SWEEP }}
          transition={{
            type: 'timing',
            duration: 1500,
            easing: 'linear',
            loop: loaded ? undefined : 'repeat',
          }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.band} />
        </EaseView>
      </Card>

      <Card
        title="B — loop leaves the transition"
        detail={
          loaded
            ? 'animate={{ translateX: 64 }} · loop removed, value unchanged'
            : 'animate={{ translateX: 64 }} · loop: repeat'
        }
      >
        <EaseView
          key={mountKey}
          initialAnimate={loaded ? undefined : { translateX: -SWEEP }}
          animate={{ translateX: SWEEP }}
          transition={{
            type: 'timing',
            duration: 1500,
            easing: 'linear',
            loop: loaded ? undefined : 'repeat',
          }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.band} />
        </EaseView>
      </Card>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, loaded && styles.buttonDisabled]}
          disabled={loaded}
          onPress={() => setLoaded(true)}
        >
          <Text style={styles.buttonText}>Load content</Text>
        </Pressable>
        <Pressable
          style={[styles.button, !loaded && styles.buttonDisabled]}
          disabled={!loaded}
          onPress={() => {
            setLoaded(false);
            setMountKey((k) => k + 1);
          }}
        >
          <Text style={styles.buttonText}>Back to skeleton</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Card({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDetail}>{detail}</Text>
      <View style={styles.track}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#aaaacc',
    marginBottom: 28,
    lineHeight: 20,
  },
  card: {
    marginBottom: 28,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e0e0ff',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6666aa',
    marginBottom: 10,
  },
  track: {
    height: 64,
    borderRadius: 12,
    backgroundColor: '#16213e',
    overflow: 'hidden',
  },
  band: {
    width: 56,
    height: '100%',
    alignSelf: 'center',
    backgroundColor: '#4a90d9',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16213e',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#e0e0ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
