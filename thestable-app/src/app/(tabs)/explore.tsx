import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CATEGORY_ICONS, CATEGORY_LABELS, type AttractionCategory } from '@/core/attractions';
import { ATTRACTIONS } from '@/data/attractions';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as AttractionCategory[];

export default function ExploreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [filter, setFilter] = useState<AttractionCategory | null>(null);

  const shown = useMemo(
    () => (filter ? ATTRACTIONS.filter((a) => a.category === filter) : ATTRACTIONS),
    [filter],
  );

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.heading}>
        Explore Bulgaria
      </ThemedText>

      <Card onPress={() => router.push('/drive')} style={{ backgroundColor: theme.primary }}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          🎧 Drive mode
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.onPrimary }}>
          Start it before you set off — the app narrates attractions you are near or heading
          towards, hands-free through the car speakers.
        </ThemedText>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {[null, ...CATEGORIES].map((category) => {
          const selected = filter === category;
          return (
            <Pressable
              key={category ?? 'all'}
              onPress={() => setFilter(category)}
              style={[
                styles.filterChip,
                { backgroundColor: selected ? theme.primary : theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
                {category ? `${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}` : 'All'}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {shown.map((attraction) => (
        <Card key={attraction.id} onPress={() => router.push(`/attraction/${attraction.id}`)}>
          <View style={styles.rowBetween}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              {CATEGORY_ICONS[attraction.category]} {attraction.name}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {attraction.region} · ~{Math.round(attraction.visitMinutes / 30) / 2}h visit
          </ThemedText>
          <ThemedText type="small">{attraction.blurb}</ThemedText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    paddingTop: Spacing.three,
  },
  filters: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flexShrink: 1,
  },
});
