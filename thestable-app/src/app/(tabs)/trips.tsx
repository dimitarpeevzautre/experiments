import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  currentDayNumber,
  nextStop,
  nightsOut,
  stopTypeCounts,
  totalKm,
  tripProgress,
  STOP_TYPE_META,
} from '@/core/trips';
import { TRIPS, getTrip } from '@/data/trips';
import { loadActiveTrip, type ActiveTripState } from '@/services/tripStore';
import { useTheme } from '@/hooks/use-theme';

export default function TripsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [active, setActive] = useState<ActiveTripState | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadActiveTrip().then((state) => alive && setActive(state));
      return () => {
        alive = false;
      };
    }, []),
  );

  const activeTrip = active ? getTrip(active.tripId) : undefined;
  const activeNext = activeTrip && active ? nextStop(activeTrip, active.completedStopIds) : null;
  const activeProgress = activeTrip && active ? tripProgress(activeTrip, active.completedStopIds) : null;

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.heading}>
        Road trips
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Curated multi-day loops with the driving, sights, food and sleep spots already worked out.
        Start one and check off stops as you go — drive mode narrates the sights on the way.
      </ThemedText>

      {activeTrip && active && activeProgress && (
        <Card
          onPress={() => router.push(`/trip/${activeTrip.id}`)}
          style={{ backgroundColor: theme.primary }}>
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            CONTINUE YOUR TRIP
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: theme.onPrimary }}>
            {activeTrip.icon} {activeTrip.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.onPrimary }}>
            Day {currentDayNumber(activeTrip, active.completedStopIds)} of {activeTrip.days.length}
            {activeNext
              ? ` · next: ${STOP_TYPE_META[activeNext.stop.type].icon} ${activeNext.stop.name}`
              : ' · all stops done 🎉'}
          </ThemedText>
          <ProgressBar done={activeProgress.done} total={activeProgress.total} />
        </Card>
      )}

      {TRIPS.map((trip) => {
        const counts = stopTypeCounts(trip);
        const sights = counts.attraction ?? 0;
        const food = counts.restaurant ?? 0;
        return (
          <Card key={trip.id} onPress={() => router.push(`/trip/${trip.id}`)}>
            <ThemedText type="smallBold" style={styles.tripTitle}>
              {trip.icon} {trip.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {trip.tagline}
            </ThemedText>
            <View style={styles.pills}>
              <Pill label={`${trip.days.length} days`} tone="primary" />
              <Pill label={`${totalKm(trip)} km`} />
              <Pill label={`${sights} sights`} />
              {food > 0 && <Pill label={`${food} food stops`} />}
              <Pill label={`${nightsOut(trip)} nights out`} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {trip.regions.join(' · ')}
            </ThemedText>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    paddingTop: Spacing.three,
  },
  tripTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
