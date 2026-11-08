import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { EaseView } from 'react-native-ease';

// Issue #72 — iOS: a recycled EaseView loses overflow: 'hidden' and
// borderRadius.
// https://github.com/appandflow/react-native-ease/issues/72
//
// prepareForRecycle reset masksToBounds and cornerRadius on the layer, but
// RCTViewComponentView keeps _props across recycling and only applies a style
// value again when it changes. Remounted with the same style, the view stays
// unclipped with square corners.
//
// Steps to reproduce:
// A. Press Unmount A, then Mount A again (the pill reuses the recycled view).
//    Expected: the same rounded red pill. Without the fix: the whole 300x300
//    red square shows, with square corners.
// B. Press Unmount B, then Mount B again. Odd mounts use transformOrigin
//    top-left and animate only opacity; even mounts use the default origin and
//    scale to 0.6. Expected: the scaled square sits centred in the outline. If
//    anchorPoint is not reset on recycle, it scales from the top-left instead.

export default function RecycledViewScreen() {
  const [clipShown, setClipShown] = useState(true);
  const [clipMounts, setClipMounts] = useState(1);
  const [anchorShown, setAnchorShown] = useState(true);
  const [anchorMounts, setAnchorMounts] = useState(1);
  const topLeftOrigin = anchorMounts % 2 === 1;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Issue #72 — Recycled clipping' }} />
      <Text style={styles.body}>
        Unmount and mount each case again. A must stay a rounded pill. B must
        stay centred in its outline on even mounts.
      </Text>
      <Text style={styles.link}>
        github.com/appandflow/react-native-ease/issues/72
      </Text>

      <Text style={styles.cardTitle}>A — clipping, mount #{clipMounts}</Text>
      <View style={styles.stage}>
        {clipShown && (
          <EaseView
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.pill}
          >
            <View style={styles.oversized} />
          </EaseView>
        )}
      </View>
      <Pressable
        style={styles.button}
        onPress={() => {
          if (!clipShown) setClipMounts((n) => n + 1);
          setClipShown((s) => !s);
        }}
      >
        <Text style={styles.buttonText}>
          {clipShown ? 'Unmount A' : 'Mount A again'}
        </Text>
      </Pressable>

      <Text style={styles.cardTitle}>
        B — anchor, mount #{anchorMounts} (
        {topLeftOrigin ? 'origin top-left, opacity' : 'default origin, scale'})
      </Text>
      <View style={styles.stage}>
        <View style={styles.outline}>
          <View style={styles.expected} />
          {anchorShown &&
            (topLeftOrigin ? (
              <EaseView
                animate={{ opacity: 1 }}
                transformOrigin={{ x: 0, y: 0 }}
                transition={{ type: 'timing', duration: 200 }}
                style={[styles.square, styles.squareFaint]}
              />
            ) : (
              <EaseView
                animate={{ scale: 0.6 }}
                transition={{ type: 'none' }}
                style={styles.square}
              />
            ))}
        </View>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => {
          if (!anchorShown) setAnchorMounts((n) => n + 1);
          setAnchorShown((s) => !s);
        }}
      >
        <Text style={styles.buttonText}>
          {anchorShown ? 'Unmount B' : 'Mount B again'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  body: {
    color: '#a0a0c0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  link: {
    color: '#6666aa',
    fontSize: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e0e0ff',
    marginBottom: 8,
  },
  stage: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pill: {
    width: 160,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#4a90d9',
  },
  oversized: {
    width: 300,
    height: 300,
    backgroundColor: '#e05555',
  },
  outline: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#6666aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expected: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderWidth: 1,
    borderColor: '#5fd38d',
  },
  square: {
    width: 120,
    height: 120,
    backgroundColor: '#4a90d9',
  },
  squareFaint: {
    backgroundColor: '#4a90d966',
  },
  button: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16213e',
    marginBottom: 24,
  },
  buttonText: {
    color: '#e0e0ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
