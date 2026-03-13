import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen    from './screens/SplashScreen';
import MapScreen       from './screens/MapScreen';
import AlertsScreen    from './screens/AlertsScreen';
import SubmitTipScreen from './screens/SubmitTipScreen';
import SavedScreen     from './screens/SavedScreen';
import SpotDetail      from './screens/SpotDetail';

import { ORANGE, WHITE, LIGHT_GRAY, MID_GRAY } from './constants/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
      {focused && (
        <View style={{ width: 18, height: 3, backgroundColor: ORANGE, borderRadius: 2, marginTop: 2 }} />
      )}
    </View>
  );
}

const headerOpts = {
  headerStyle: { backgroundColor: ORANGE },
  headerTintColor: WHITE,
  headerTitleStyle: { fontWeight: '900', fontSize: 20, letterSpacing: -0.5 },
  headerTitle: '📍 SoonSpot',
  headerShadowVisible: false,
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOpts,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopWidth: 2,
          borderTopColor: LIGHT_GRAY,
          paddingTop: 6,
          paddingBottom: 20,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: MID_GRAY,
      }}
    >
      <Tab.Screen name="Map"        component={MapScreen}       options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗺"  focused={focused} /> }} />
      <Tab.Screen name="Alerts"     component={AlertsScreen}    options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} /> }} />
      <Tab.Screen name="Submit Tip" component={SubmitTipScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💡" focused={focused} /> }} />
      <Tab.Screen name="Saved"      component={SavedScreen}     options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="❤️"  focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs"       component={Tabs} />
          <Stack.Screen name="SpotDetail" component={SpotDetail}
            options={{ animation: 'slide_from_bottom', headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}