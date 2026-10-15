import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { EaseView } from 'react-native-ease';

// Issue #66 — iOS loops stop after the app returns from the background.
// https://github.com/appandflow/react-native-ease/issues/66
//
// Steps to reproduce:
// 1. Both loops below run.
// 2. Press Home, then reopen the app.
// 3. Expected: both keep running from where they were, and the mount id is
//    unchanged. Without the fix they stay frozen at their resting value.

export default function BackgroundLoopsScreen() {
  const [mountId] = useState(() => Math.random().toString(36).slice(2, 8));

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Issue #66 — Background loops' }} />
      <Text style={styles.body}>
        Background the app (Home), then reopen it. Both loops must keep running.
        Mount {mountId} must not change.
      </Text>
      <View style={styles.row}>
        <EaseView
          initialAnimate={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            type: 'timing',
            duration: 2000,
            easing: 'linear',
            loop: 'repeat',
          }}
          style={styles.spinner}
        />
        <EaseView
          initialAnimate={{ scale: 0.6, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 900,
            easing: 'easeInOut',
            loop: 'reverse',
          }}
          style={styles.pulse}
        />
      </View>
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
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#4a90d9',
  },
  pulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e94560',
  },
});
