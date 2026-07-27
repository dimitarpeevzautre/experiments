import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  bookingPhase,
  formatDateRange,
  nights,
  todayISO,
  totalPrice,
  type Booking,
  type BookingPhase,
} from '@/core/booking';
import { getCamper } from '@/data/fleet';
import { fetchBookings } from '@/services/bookings';

const PHASE_ORDER: BookingPhase[] = ['active', 'upcoming', 'completed', 'cancelled'];
const PHASE_LABEL: Record<BookingPhase, string> = {
  active: 'On the road',
  upcoming: 'Upcoming',
  completed: 'Past trips',
  cancelled: 'Cancelled',
};
const PHASE_TONE: Record<BookingPhase, 'primary' | 'accent' | 'neutral' | 'danger'> = {
  active: 'primary',
  upcoming: 'accent',
  completed: 'neutral',
  cancelled: 'danger',
};

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const today = todayISO();

  useEffect(() => {
    let alive = true;
    fetchBookings().then((all) => alive && setBookings(all));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.heading}>
        Your bookings
      </ThemedText>

      {PHASE_ORDER.map((phase) => {
        const group = bookings.filter((b) => bookingPhase(b, today) === phase);
        if (group.length === 0) return null;
        return (
          <View key={phase} style={styles.group}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {PHASE_LABEL[phase].toUpperCase()}
            </ThemedText>
            {group.map((booking) => {
              const camper = getCamper(booking.camperId);
              return (
                <Card key={booking.id} onPress={() => router.push(`/booking/${booking.id}`)}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="smallBold">
                      {camper ? `${camper.emoji} ${camper.name}` : booking.camperId}
                    </ThemedText>
                    <Pill label={PHASE_LABEL[phase]} tone={PHASE_TONE[phase]} />
                  </View>
                  <ThemedText>{formatDateRange(booking)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {booking.reference} · {nights(booking)} nights · €{totalPrice(booking)}
                  </ThemedText>
                </Card>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    paddingTop: Spacing.three,
  },
  group: {
    gap: Spacing.two,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
