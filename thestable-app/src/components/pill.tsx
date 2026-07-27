import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'primary' | 'accent' | 'danger' }) {
  const theme = useTheme();
  const background =
    tone === 'primary'
      ? theme.primary
      : tone === 'accent'
        ? theme.accent
        : tone === 'danger'
          ? theme.danger
          : theme.backgroundSelected;
  const color = tone === 'neutral' ? theme.textSecondary : theme.onPrimary;

  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <ThemedText type="smallBold" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
});
