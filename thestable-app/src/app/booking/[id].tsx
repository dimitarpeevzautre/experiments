import { useLocalSearchParams, useRouter } from 'expo-router';
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
} from '@/core/booking';
import { getCamper } from '@/data/fleet';
import { fetchBooking } from '@/services/bookings';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let alive = true;
    if (id) fetchBooking(id).then((b) => alive && setBooking(b));
    return () => {
      alive = false;
    };
  }, [id]);

  if (!booking) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Loading booking…</ThemedText>
      </Screen>
    );
  }

  const camper = getCamper(booking.camperId);
  const phase = bookingPhase(booking, todayISO());
  const nightCount = nights(booking);

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">
          {camper ? `${camper.emoji} ${camper.name}` : booking.camperId}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{camper?.model}</ThemedText>
        <Pill
          label={phase === 'active' ? 'On the road' : phase[0].toUpperCase() + phase.slice(1)}
          tone={phase === 'active' ? 'primary' : phase === 'upcoming' ? 'accent' : 'neutral'}
        />
      </View>

      <Card>
        <ThemedText type="smallBold" themeColor="textSecondary">
          TRIP
        </ThemedText>
        <Row label="Dates" value={formatDateRange(booking)} />
        <Row label="Nights" value={String(nightCount)} />
        <Row label="Guests" value={String(booking.guests)} />
        <Row label="Pickup" value={booking.pickupLocation} />
        <Row label="Drop-off" value={booking.dropoffLocation} />
        <Row label="Reference" value={booking.reference} />
      </Card>

      <Card>
        <ThemedText type="smallBold" themeColor="textSecondary">
          PRICE
        </ThemedText>
        <Row label={`${nightCount} nights × €${booking.pricePerNight}`} value={`€${nightCount * booking.pricePerNight}`} />
        {booking.extras.map((extra) => (
          <Row key={extra.name} label={extra.name} value={`€${extra.pricePerBooking}`} />
        ))}
        <Row label="Total" value={`€${totalPrice(booking)}`} bold />
        <Row label="Deposit" value={booking.depositPaid ? 'Paid ✅' : 'Due at pickup'} />
      </Card>

      {camper && (
        <Card>
          <ThemedText type="smallBold" themeColor="textSecondary">
            YOUR CAMPER
          </ThemedText>
          <Row label="Sleeps" value={`${camper.berths} · ${camper.seats} belted seats`} />
          <Row label="Size" value={`${camper.lengthM} m long · ${camper.heightM} m tall`} />
          <Row label="Gearbox" value={camper.transmission} />
          {camper.highlights.map((h) => (
            <ThemedText key={h} type="small" themeColor="textSecondary">
              · {h}
            </ThemedText>
          ))}
        </Card>
      )}

      <Card onPress={() => router.push('/checklist/departure')}>
        <ThemedText type="smallBold">🚐 Pre-drive checklist</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Run it before every departure — your future self says thanks.
        </ThemedText>
      </Card>
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <ThemedText type={bold ? 'smallBold' : 'small'} themeColor={bold ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
      <ThemedText type={bold ? 'smallBold' : 'small'} style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
