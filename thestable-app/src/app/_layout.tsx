import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const palette = dark ? Colors.dark : Colors.light;
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.background,
      text: palette.text,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="drive" options={{ title: 'Drive mode', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="booking/[id]" options={{ title: 'Booking' }} />
        <Stack.Screen name="camper/[topicId]" options={{ title: 'Guide' }} />
        <Stack.Screen name="checklist/[checklistId]" options={{ title: 'Checklist' }} />
        <Stack.Screen name="attraction/[attractionId]" options={{ title: 'Attraction' }} />
      </Stack>
    </ThemeProvider>
  );
}
