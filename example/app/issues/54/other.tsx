import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Switching to this tab detaches the shimmer views from the window, which is
// what makes didMoveToWindow → reapplyLoopAnimations run when you come back.
export default function OtherTab() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Other tab</Text>
      <Text style={styles.body}>
        Go back to the Shimmer tab. Any card that was loaded must still be
        still.
      </Text>
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
    lineHeight: 20,
  },
});
