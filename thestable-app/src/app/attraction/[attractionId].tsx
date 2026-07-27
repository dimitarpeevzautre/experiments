import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/core/attractions';
import { getAttraction } from '@/data/attractions';
import { speak, stopSpeaking } from '@/services/narrator';
import { useTheme } from '@/hooks/use-theme';

export default function AttractionScreen() {
  const { attractionId } = useLocalSearchParams<{ attractionId: string }>();
  const theme = useTheme();
  const attraction = attractionId ? getAttraction(attractionId) : undefined;
  const [playing, setPlaying] = useState(false);

  useEffect(() => stopSpeaking, []);

  if (!attraction) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Attraction not found.</ThemedText>
      </Screen>
    );
  }

  const togglePlay = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speak(attraction.narration, () => setPlaying(false));
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: attraction.name }} />
      <View style={styles.header}>
        <ThemedText type="subtitle">
          {CATEGORY_ICONS[attraction.category]} {attraction.name}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{attraction.nameBg}</ThemedText>
        <View style={styles.pills}>
          <Pill label={CATEGORY_LABELS[attraction.category]} tone="primary" />
          <Pill label={attraction.region} />
          <Pill label={`~${Math.round(attraction.visitMinutes / 30) / 2}h visit`} />
        </View>
      </View>

      <Card onPress={togglePlay} style={{ backgroundColor: theme.primary }}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          {playing ? '⏹ Stop narration' : '▶️ Listen to the story'}
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="small">{attraction.narration}</ThemedText>
      </Card>

      {attraction.camperNotes && (
        <Card>
          <ThemedText type="smallBold">🚐 Camper notes</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {attraction.camperNotes}
          </ThemedText>
        </Card>
      )}

      <Card>
        <ThemedText type="smallBold">📍 Location</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {attraction.coords.latitude.toFixed(4)}, {attraction.coords.longitude.toFixed(4)}
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
