import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { EasePresence, EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function ExitDemo() {
  const [show, setShow] = useState(true);

  return (
    <Section title="Exit Animation">
      <View style={styles.exitContainer}>
        <EasePresence>
          {show ? (
            <EaseView
              key="exit-box"
              animate={{
                opacity: 1,
                scale: 1,
                translateY: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                translateY: 20,
              }}
              transition={{ type: 'timing', duration: 300, easing: 'easeIn' }}
              style={styles.box}
            />
          ) : null}
        </EasePresence>
      </View>
      <Button
        label={show ? 'Remove' : 'Show Again'}
        onPress={() => setShow((value: boolean) => !value)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  exitContainer: {
    width: 80,
    height: 80,
  },
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7ab8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
