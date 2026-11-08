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
// 1. A rounded pill clips a larger red square: only a red pill shows.
// 2. Press Unmount, then Mount again (the pill reuses the recycled view).
// 3. Expected: the same red pill, and the mount count goes up.
//    Without the fix: the whole 300x300 red square shows, with square corners.

export default function RecycledClipScreen() {
  const [shown, setShown] = useState(true);
  const [mounts, setMounts] = useState(1);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Issue #72 — Recycled clipping' }} />
      <Text style={styles.body}>
        Press Unmount, then Mount again. Only a rounded red pill must show, not
        a red square. Mount #{mounts}.
      </Text>
      <Text style={styles.link}>
        github.com/appandflow/react-native-ease/issues/72
      </Text>
      <View style={styles.stage}>
        {shown && (
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
          if (!shown) setMounts((n) => n + 1);
          setShown((s) => !s);
        }}
      >
        <Text style={styles.buttonText}>
          {shown ? 'Unmount' : 'Mount again'}
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
    marginBottom: 28,
  },
  stage: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
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
  button: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16213e',
  },
  buttonText: {
    color: '#e0e0ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
