import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { EaseView, type AnimatedValues } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

const TILE = 100;
const GAP = 12;
const PITCH = TILE + GAP;
const COLORS = ['#e94560', '#4a90d9', '#f5a623', '#7ed321', '#9013fe'];
const ICON = require('../../assets/icon.png');
const SET_WIDTH = PITCH * COLORS.length;
const SPEED_PT_PER_S = 40;
const LOOP_MS = (SET_WIDTH / SPEED_PT_PER_S) * 1000;
const TILES = [...COLORS, ...COLORS, ...COLORS];

function format(values: AnimatedValues | null) {
  if (!values) return '—';
  return Object.entries(values)
    .map(([key, value]) =>
      typeof value === 'number' ? `${key}: ${value.toFixed(2)}` : key,
    )
    .join(', ');
}

export function PauseDemo() {
  const [paused, setPaused] = useState(false);
  const [pausedValues, setPausedValues] = useState<AnimatedValues | null>(null);
  const [loadStarts, setLoadStarts] = useState(0);
  const [mountId] = useState(() => Math.random().toString(36).slice(2, 8));
  const [pauseEvents, setPauseEvents] = useState(0);
  // react-native-web re-reports a load start whenever this callback changes.
  const countLoadStart = useCallback(() => setLoadStarts((n) => n + 1), []);

  const [moved, setMoved] = useState(false);
  const [enterKey, setEnterKey] = useState(0);
  const [boxValues, setBoxValues] = useState<AnimatedValues | null>(null);

  return (
    <>
      <Section title="Marquee (repeat loop)">
        <View style={styles.viewport}>
          <EaseView
            initialAnimate={{ translateX: 0 }}
            animate={{ translateX: -SET_WIDTH }}
            transition={{
              type: 'timing',
              duration: LOOP_MS,
              easing: 'linear',
              loop: 'repeat',
            }}
            paused={paused}
            onPaused={({ values }) => {
              setPauseEvents((n) => n + 1);
              setPausedValues(values);
            }}
            style={styles.track}
            testID="pause-marquee"
          >
            {TILES.map((color, index) => (
              <View
                key={index}
                style={[styles.tile, { backgroundColor: color }]}
              >
                <Image
                  source={ICON}
                  onLoadStart={countLoadStart}
                  style={styles.icon}
                />
                <Text style={styles.tileLabel}>{index % COLORS.length}</Text>
              </View>
            ))}
          </EaseView>
        </View>
        <Text style={styles.readout} testID="pause-readout">
          onPaused #{pauseEvents}: {format(pausedValues)}
        </Text>
        <Text style={styles.readout}>
          mount {mountId} · image load starts {loadStarts} (stays at{' '}
          {TILES.length} if nothing reloads)
        </Text>
        <Button
          label={paused ? 'Resume' : 'Pause'}
          onPress={() => setPaused((p) => !p)}
        />
      </Section>

      <Section title="Delayed timing and spring">
        <EaseView
          animate={{ translateX: moved ? 160 : 0 }}
          transition={{ type: 'timing', duration: 1200, delay: 300 }}
          paused={paused}
          onPaused={({ values }) => setBoxValues(values)}
          style={[styles.box, styles.timingBox]}
        />
        <EaseView
          animate={{ translateX: moved ? 160 : 0 }}
          transition={{ type: 'spring', damping: 6, stiffness: 60 }}
          paused={paused}
          style={[styles.box, styles.springBox]}
        />
        <Text style={styles.readout}>
          Pause mid-move, wait, then resume: both boxes continue from where they
          stopped. Moving while paused starts once resumed.
        </Text>
        <Text style={styles.readout}>timing box: {format(boxValues)}</Text>
        <Button label="Move" onPress={() => setMoved((m) => !m)} />
      </Section>

      <Section title="Enter while paused">
        <EaseView
          key={enterKey}
          initialAnimate={{ opacity: 0, translateX: -40 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 800 }}
          paused={paused}
          style={[styles.box, styles.enterBox]}
        />
        <Text style={styles.readout}>
          Mounted while paused, it waits at its initial values and enters once
          resumed.
        </Text>
        <Button label="Remount" onPress={() => setEnterKey((k) => k + 1)} />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  viewport: {
    height: TILE,
    overflow: 'hidden',
    borderRadius: 12,
  },
  track: {
    flexDirection: 'row',
    gap: GAP,
    width: PITCH * TILES.length,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 56,
    height: 56,
  },
  tileLabel: {
    position: 'absolute',
    left: 8,
    top: 4,
    color: 'white',
    fontWeight: '800',
  },
  readout: {
    marginTop: 12,
    color: '#a0a0c0',
    fontSize: 13,
  },
  box: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginBottom: 8,
  },
  timingBox: {
    backgroundColor: '#4a90d9',
  },
  springBox: {
    backgroundColor: '#e94560',
  },
  enterBox: {
    backgroundColor: '#7ed321',
  },
});
