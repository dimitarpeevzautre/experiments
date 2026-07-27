import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { todayISO } from '@/core/booking';
import {
  hasWildCamping,
  nextStop,
  nightsOut,
  toggleStop,
  totalKm,
  tripProgress,
  STOP_TYPE_META,
  type TripStop,
} from '@/core/trips';
import { getTrip } from '@/data/trips';
import {
  clearActiveTrip,
  loadActiveTrip,
  saveActiveTrip,
  type ActiveTripState,
} from '@/services/tripStore';
import { useTheme } from '@/hooks/use-theme';

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const trip = tripId ? getTrip(tripId) : undefined;

  const [active, setActive] = useState<ActiveTripState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    loadActiveTrip().then((state) => {
      if (!alive) return;
      setActive(state);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!trip) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Trip not found.</ThemedText>
      </Screen>
    );
  }

  const isActive = active?.tripId === trip.id;
  const otherTripActive = !!active && !isActive;
  const completed = isActive ? active.completedStopIds : [];
  const progress = tripProgress(trip, completed);
  const upNext = isActive ? nextStop(trip, completed) : null;

  const start = () => {
    const state: ActiveTripState = { tripId: trip.id, startedOn: todayISO(), completedStopIds: [] };
    setActive(state);
    saveActiveTrip(state);
  };

  const end = () => {
    setActive(null);
    clearActiveTrip();
  };

  const toggle = (stop: TripStop) => {
    if (!isActive || !active) return;
    const state = { ...active, completedStopIds: toggleStop(active.completedStopIds, stop.id) };
    setActive(state);
    saveActiveTrip(state);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: trip.title }} />
      <View style={styles.header}>
        <ThemedText type="subtitle">
          {trip.icon} {trip.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {trip.tagline}
        </ThemedText>
        <View style={styles.pills}>
          <Pill label={`${trip.days.length} days`} tone="primary" />
          <Pill label={`${totalKm(trip)} km`} />
          <Pill label={`${nightsOut(trip)} nights out`} />
        </View>
      </View>

      {loaded && !isActive && (
        <Card onPress={start} style={{ backgroundColor: theme.primary }}>
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            🚀 Start this trip
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.onPrimary }}>
            {otherTripActive
              ? 'This replaces your current active trip and its progress.'
              : 'Check off stops as you go — your progress is saved on this phone.'}
          </ThemedText>
        </Card>
      )}

      {isActive && (
        <Card>
          <View style={styles.rowBetween}>
            <ThemedText type="smallBold">
              {progress.complete ? 'Trip complete 🎉' : 'In progress'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {progress.done}/{progress.total} stops
            </ThemedText>
          </View>
          <ProgressBar done={progress.done} total={progress.total} />
          {upNext && (
            <ThemedText type="small" themeColor="textSecondary">
              Up next · Day {upNext.day.day}: {STOP_TYPE_META[upNext.stop.type].icon}{' '}
              {upNext.stop.name}
            </ThemedText>
          )}
        </Card>
      )}

      {hasWildCamping(trip) && (
        <Card>
          <ThemedText type="smallBold">⛺ About wild camping</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            The wild spots on this route are places campers commonly use, but wild camping in
            Bulgaria is tolerated rather than formally allowed. Stay clear of national-park core
            zones and reserves, arrive late, leave early, take everything with you.
          </ThemedText>
        </Card>
      )}

      {trip.days.map((day) => (
        <View key={day.day} style={styles.daySection}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            DAY {day.day} — {day.title.toUpperCase()} · {day.driveKm} KM
          </ThemedText>
          {day.stops.map((stop) => {
            const checked = completed.includes(stop.id);
            const isNext = upNext?.stop.id === stop.id;
            return (
              <Card
                key={stop.id}
                onPress={isActive ? () => toggle(stop) : undefined}
                style={isNext ? { borderWidth: 2, borderColor: theme.primary } : undefined}>
                <View style={styles.stopRow}>
                  {isActive && (
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: checked ? theme.primary : theme.textSecondary,
                          backgroundColor: checked ? theme.primary : 'transparent',
                        },
                      ]}>
                      {checked && (
                        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                          ✓
                        </ThemedText>
                      )}
                    </View>
                  )}
                  <View style={styles.stopBody}>
                    <View style={styles.rowBetween}>
                      <ThemedText
                        type="smallBold"
                        style={styles.stopName}
                        themeColor={checked ? 'textSecondary' : 'text'}>
                        {STOP_TYPE_META[stop.type].icon} {stop.name}
                      </ThemedText>
                      {isNext && <Pill label="Up next" tone="accent" />}
                      {stop.overnight && !isNext && <Pill label="Overnight" />}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {STOP_TYPE_META[stop.type].label}
                      {stop.camperNotes ? ` · ${stop.camperNotes}` : ''}
                    </ThemedText>
                    <ThemedText type="small">{stop.description}</ThemedText>
                    {stop.attractionId && (
                      <Pressable onPress={() => router.push(`/attraction/${stop.attractionId}`)}>
                        <ThemedText type="linkPrimary">Story & details →</ThemedText>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      ))}

      {isActive && (
        <Pressable onPress={end} style={styles.endTrip}>
          <ThemedText type="smallBold" style={{ color: theme.danger }}>
            End trip & clear progress
          </ThemedText>
        </Pressable>
      )}
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
  daySection: {
    gap: Spacing.two,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  stopBody: {
    flex: 1,
    gap: Spacing.two,
  },
  stopName: {
    flexShrink: 1,
  },
  endTrip: {
    alignSelf: 'center',
    padding: Spacing.three,
  },
});
