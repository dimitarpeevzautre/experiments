/** Camper operation checklists: definitions + pure state helpers. */

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

export interface ChecklistDefinition {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: ChecklistItem[];
}

/** itemId -> checked */
export type ChecklistState = Record<string, boolean>;

export function toggleItem(state: ChecklistState, itemId: string): ChecklistState {
  return { ...state, [itemId]: !state[itemId] };
}

export function progress(definition: ChecklistDefinition, state: ChecklistState): {
  done: number;
  total: number;
  complete: boolean;
} {
  const done = definition.items.filter((item) => state[item.id]).length;
  const total = definition.items.length;
  return { done, total, complete: total > 0 && done === total };
}

export function resetState(): ChecklistState {
  return {};
}
