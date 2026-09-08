import { Tabs, Stack } from 'expo-router';

export default function StaleLoopLayout() {
  return (
    <>
      <Stack.Screen options={{ title: 'Stale loop survives props' }} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#8888aa',
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#16213e',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Shimmer' }} />
        <Tabs.Screen name="other" options={{ title: 'Other' }} />
      </Tabs>
    </>
  );
}
