import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import {
  bookingPhase,
  daysUntilPickup,
  formatDateRange,
  primaryBooking,
  todayISO,
  type Booking,
} from '@/core/booking';
import { Spacing } from '@/constants/theme';
import { getCamper } from '@/data/fleet';
import { fetchBookings } from '@/services/bookings';

export default function HomeScreen() {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loaded, setLoaded] = useState(false);
  const today = todayISO();

  useEffect(() => {
    let alive = true;
    fetchBookings().then((all) => {
      if (!alive) return;
      setBooking(primaryBooking(all, today));
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [today]);

  const camper = booking ? getCamper(booking.camperId) : null;
  const phase = booking ? bookingPhase(booking, today) : null;

  return (
    <Screen>
      <View style={styles.hero}>
        <ThemedText type="title" style={styles.brand}>
          The Stable
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Your camper, your Bulgaria. Saddle up. 🐎
        </ThemedText>
      </View>

      {loaded && booking && (
        <Card onPress={() => router.push(`/booking/${booking.id}`)}>
          {phase === 'active' ? (
            <Pill label="Trip in progress" tone="primary" />
          ) : (
            <Pill label={`Pickup in ${daysUntilPickup(booking, today)} days`} tone="accent" />
          )}
          <ThemedText type="subtitle">
            {camper ? `${camper.emoji} ${camper.name}` : booking.reference}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{camper?.model}</ThemedText>
          <ThemedText>{formatDateRange(booking)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {phase === 'active'
              ? `Return: ${booking.dropoffLocation}`
              : `Pickup: ${booking.pickupLocation}`}
          </ThemedText>
        </Card>
      )}

      {loaded && !booking && (
        <Card>
          <ThemedText type="subtitle">No trips yet</ThemedText>
          <ThemedText themeColor="textSecondary">
            Book a camper at thestable.bg and it will show up here.
          </ThemedText>
        </Card>
      )}

      <ThemedText type="subtitle">Quick actions</ThemedText>
      <View style={styles.grid}>
        <Card style={styles.gridItem} onPress={() => router.push('/drive')}>
          <ThemedText style={styles.actionIcon}>🎧</ThemedText>
          <ThemedText type="smallBold">Drive mode</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Hear about places as you drive
          </ThemedText>
        </Card>
        <Card style={styles.gridItem} onPress={() => router.push('/checklist/departure')}>
          <ThemedText style={styles.actionIcon}>🚐</ThemedText>
          <ThemedText type="smallBold">Before driving off</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            The don&apos;t-lose-the-roof checklist
          </ThemedText>
        </Card>
        <Card style={styles.gridItem} onPress={() => router.push('/camper/trouble')}>
          <ThemedText style={styles.actionIcon}>🆘</ThemedText>
          <ThemedText type="smallBold">Something&apos;s wrong</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Quick fixes & 24/7 contact
          </ThemedText>
        </Card>
        <Link href="/explore" asChild>
          <Card style={styles.gridItem}>
            <ThemedText style={styles.actionIcon}>🗺️</ThemedText>
            <ThemedText type="smallBold">Explore Bulgaria</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              19 hand-picked stops
            </ThemedText>
          </Card>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  brand: {
    fontSize: 40,
    lineHeight: 46,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridItem: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  actionIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
});
