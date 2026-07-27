import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getTopic } from '@/data/camperGuide';
import { useTheme } from '@/hooks/use-theme';

export default function GuideTopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const theme = useTheme();
  const topic = topicId ? getTopic(topicId) : undefined;

  if (!topic) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Topic not found.</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: topic.title }} />
      <View style={styles.header}>
        <ThemedText type="subtitle">
          {topic.icon} {topic.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{topic.summary}</ThemedText>
      </View>

      {topic.sections.map((section) => (
        <Card key={section.heading}>
          <ThemedText type="smallBold">{section.heading}</ThemedText>
          <ThemedText type="small">{section.body}</ThemedText>
          {section.warning && (
            <View style={[styles.warning, { borderColor: theme.danger }]}>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                ⚠️ {section.warning}
              </ThemedText>
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  warning: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.half,
  },
});
