import { progress, resetState, toggleItem, type ChecklistDefinition } from '../checklists';

const DEF: ChecklistDefinition = {
  id: 'test',
  title: 'Test',
  icon: '✅',
  description: '',
  items: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ],
};

describe('toggleItem', () => {
  it('toggles on and off without mutating', () => {
    const s0 = resetState();
    const s1 = toggleItem(s0, 'a');
    const s2 = toggleItem(s1, 'a');
    expect(s1.a).toBe(true);
    expect(s2.a).toBe(false);
    expect(s0).toEqual({});
  });
});

describe('progress', () => {
  it('counts checked items against the definition', () => {
    const state = { a: true, b: false, zombie: true }; // stale ids don't count
    expect(progress(DEF, state)).toEqual({ done: 1, total: 3, complete: false });
  });

  it('reports completion', () => {
    const state = { a: true, b: true, c: true };
    expect(progress(DEF, state)).toEqual({ done: 3, total: 3, complete: true });
  });

  it('an empty checklist is never complete', () => {
    expect(progress({ ...DEF, items: [] }, {}).complete).toBe(false);
  });
});
