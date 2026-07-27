import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ChecklistState } from '@/core/checklists';

const keyFor = (checklistId: string) => `checklist:${checklistId}`;

export async function loadChecklistState(checklistId: string): Promise<ChecklistState> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(checklistId));
    return raw ? (JSON.parse(raw) as ChecklistState) : {};
  } catch {
    return {};
  }
}

export async function saveChecklistState(checklistId: string, state: ChecklistState): Promise<void> {
  await AsyncStorage.setItem(keyFor(checklistId), JSON.stringify(state));
}

export async function clearChecklistState(checklistId: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(checklistId));
}
