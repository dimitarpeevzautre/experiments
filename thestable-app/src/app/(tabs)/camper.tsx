import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { progress, type ChecklistState } from '@/core/checklists';
import { GUIDE_TOPICS } from '@/data/camperGuide';
import { CHECKLISTS } from '@/data/checklists';
import { loadChecklistState } from '@/services/checklistStore';

export default function CamperScreen() {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, ChecklistState>>({});

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all(CHECKLISTS.map((c) => loadChecklistState(c.id))).then((loaded) => {
        if (!alive) return;
        setStates(Object.fromEntries(CHECKLISTS.map((c, i) => [c.id, loaded[i]])));
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.heading}>
        Operating your camper
      </ThemedText>

      <ThemedText type="smallBold" themeColor="textSecondary">
        CHECKLISTS
      </ThemedText>
      {CHECKLISTS.map((checklist) => {
        const p = progress(checklist, states[checklist.id] ?? {});
        return (
          <Card key={checklist.id} onPress={() => router.push(`/checklist/${checklist.id}`)}>
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold">
                {checklist.icon} {checklist.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {p.done}/{p.total}
              </ThemedText>
            </View>
            <ProgressBar done={p.done} total={p.total} />
            <ThemedText type="small" themeColor="textSecondary">
              {checklist.description}
            </ThemedText>
          </Card>
        );
      })}

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionGap}>
        HOW EVERYTHING WORKS
      </ThemedText>
      {GUIDE_TOPICS.map((topic) => (
        <Card key={topic.id} onPress={() => router.push(`/camper/${topic.id}`)}>
          <ThemedText type="smallBold">
            {topic.icon} {topic.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {topic.summary}
          </ThemedText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    paddingTop: Spacing.three,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionGap: {
    marginTop: Spacing.three,
  },
});
