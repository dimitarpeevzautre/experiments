import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Pill } from '@/components/pill';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { progress, resetState, toggleItem, type ChecklistState } from '@/core/checklists';
import { getChecklist } from '@/data/checklists';
import { loadChecklistState, saveChecklistState } from '@/services/checklistStore';
import { useTheme } from '@/hooks/use-theme';

export default function ChecklistScreen() {
  const { checklistId } = useLocalSearchParams<{ checklistId: string }>();
  const theme = useTheme();
  const checklist = checklistId ? getChecklist(checklistId) : undefined;
  const [state, setState] = useState<ChecklistState>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    if (checklistId) {
      loadChecklistState(checklistId).then((s) => {
        if (!alive) return;
        setState(s);
        setLoaded(true);
      });
    }
    return () => {
      alive = false;
    };
  }, [checklistId]);

  if (!checklist) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Checklist not found.</ThemedText>
      </Screen>
    );
  }

  const update = (next: ChecklistState) => {
    setState(next);
    saveChecklistState(checklist.id, next);
  };

  const p = progress(checklist, state);

  return (
    <Screen>
      <Stack.Screen options={{ title: checklist.title }} />
      <View style={styles.header}>
        <ThemedText type="subtitle">
          {checklist.icon} {checklist.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{checklist.description}</ThemedText>
        <ProgressBar done={p.done} total={p.total} />
        {p.complete && <Pill label="All done — happy trails! 🎉" tone="primary" />}
      </View>

      {loaded &&
        checklist.items.map((item) => {
          const checked = !!state[item.id];
          return (
            <Card key={item.id} onPress={() => update(toggleItem(state, item.id))}>
              <View style={styles.itemRow}>
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
                <View style={styles.itemText}>
                  <ThemedText
                    type="small"
                    style={checked ? styles.checkedLabel : undefined}
                    themeColor={checked ? 'textSecondary' : 'text'}>
                    {item.label}
                  </ThemedText>
                  {item.hint && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.hint}
                    </ThemedText>
                  )}
                </View>
              </View>
            </Card>
          );
        })}

      <Pressable onPress={() => update(resetState())} style={styles.reset}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Reset checklist
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    gap: Spacing.half,
  },
  checkedLabel: {
    textDecorationLine: 'line-through',
  },
  reset: {
    alignSelf: 'center',
    padding: Spacing.three,
  },
});
