import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CATEGORY_ICONS } from '@/core/attractions';
import { useDrive } from '@/hooks/use-drive';
import { useTheme } from '@/hooks/use-theme';

export default function DriveScreen() {
  const theme = useTheme();
  const router = useRouter();
  const drive = useDrive();
  const running = drive.status === 'driving' || drive.status === 'simulating';

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">🎧 Drive mode</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Connect your phone to the car (Bluetooth, Android Auto or CarPlay) and the narration
          plays through the speakers. The app talks about attractions you are near or heading
          towards — each one only once per trip.
        </ThemedText>
      </View>

      {!running && (
        <>
          <Card onPress={drive.startGps} style={{ backgroundColor: theme.primary }}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              ▶️ Start driving
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onPrimary }}>
              Uses GPS while the app is open.
            </ThemedText>
          </Card>
          <Card onPress={drive.startSimulation}>
            <ThemedText type="smallBold">🧪 Demo drive</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Simulates Sofia → Veliko Tarnovo at 60× speed so you can hear how it works from the
              sofa.
            </ThemedText>
          </Card>
          {drive.status === 'denied' && (
            <Card>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Location permission needed
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Allow location access in system settings to use drive mode with real GPS — or try
                the demo drive.
              </ThemedText>
            </Card>
          )}
          {drive.status === 'locating' && (
            <ThemedText type="small" themeColor="textSecondary">
              Getting a GPS fix…
            </ThemedText>
          )}
        </>
      )}

      {running && (
        <>
          <View style={styles.statusRow}>
            <Pill
              label={drive.status === 'simulating' ? 'Demo drive' : 'Live GPS'}
              tone={drive.status === 'simulating' ? 'accent' : 'primary'}
            />
            {drive.speedKmh != null && <Pill label={`${Math.round(drive.speedKmh)} km/h`} />}
            <Pill label={`${drive.playedCount} stories told`} />
          </View>

          {drive.nowPlaying ? (
            <Card style={{ backgroundColor: theme.primary }}>
              <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                Now playing
              </ThemedText>
              <ThemedText type="subtitle" style={{ color: theme.onPrimary }}>
                {CATEGORY_ICONS[drive.nowPlaying.attraction.category]}{' '}
                {drive.nowPlaying.attraction.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.onPrimary }}>
                {drive.nowPlaying.reason === 'near'
                  ? 'Right next to you'
                  : `${Math.round(drive.nowPlaying.distanceKm)} km ahead`}
              </ThemedText>
              <Pressable onPress={drive.skip}>
                <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                  ⏭ Skip
                </ThemedText>
              </Pressable>
            </Card>
          ) : (
            <Card>
              <ThemedText type="smallBold">Listening for the road…</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {drive.upNext.length > 0
                  ? 'Something interesting is coming up.'
                  : 'Nothing in range yet — keep rolling.'}
              </ThemedText>
            </Card>
          )}

          {drive.upNext.length > 0 && (
            <>
              <ThemedText type="smallBold" themeColor="textSecondary">
                WITHIN REACH
              </ThemedText>
              {drive.upNext.slice(0, 4).map((candidate) => (
                <Card
                  key={candidate.attraction.id}
                  onPress={() => router.push(`/attraction/${candidate.attraction.id}`)}>
                  <ThemedText type="smallBold">
                    {CATEGORY_ICONS[candidate.attraction.category]} {candidate.attraction.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {Math.round(candidate.distanceKm)} km ·{' '}
                    {candidate.reason === 'near' ? 'nearby' : 'on your way'}
                  </ThemedText>
                </Card>
              ))}
            </>
          )}

          <Card onPress={drive.stop}>
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              ⏹ End drive
            </ThemedText>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
