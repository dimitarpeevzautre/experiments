import type { ChecklistDefinition } from '@/core/checklists';

export const CHECKLISTS: ChecklistDefinition[] = [
  {
    id: 'departure',
    title: 'Before driving off',
    icon: '🚐',
    description: 'Run this every time you leave a camp spot.',
    items: [
      { id: 'roof', label: 'Pop-top / roof closed and latched' },
      { id: 'windows', label: 'Windows and roof vents closed' },
      { id: 'gas', label: 'Gas bottle valve closed', hint: 'Rear locker, turn clockwise.' },
      { id: 'pump', label: 'Water pump switched off' },
      { id: 'fridge', label: 'Fridge door locked' },
      { id: 'loose', label: 'Loose items stowed, drawers latched', hint: 'The first roundabout will find anything you forgot.' },
      { id: 'step', label: 'Entry step retracted' },
      { id: 'cable', label: '230V cable unplugged and stowed' },
      { id: 'chocks', label: 'Levelling chocks collected' },
      { id: 'walkaround', label: 'Full walk-around: lights, tyres, nothing underneath' },
    ],
  },
  {
    id: 'camp-setup',
    title: 'Setting up camp',
    icon: '⛺',
    description: 'Arriving at a site? Do these and then relax.',
    items: [
      { id: 'level', label: 'Park level (use chocks if needed)', hint: 'Fridge and shower drain both care.' },
      { id: 'handbrake', label: 'Handbrake on, 1st gear' },
      { id: 'hookup', label: 'Hook up 230V if available', hint: 'Camper side first, then the pillar.' },
      { id: 'gas-open', label: 'Open gas bottle valve half a turn' },
      { id: 'pump-on', label: 'Water pump on' },
      { id: 'awning', label: 'Awning out — only in calm weather' },
    ],
  },
  {
    id: 'return',
    title: 'Returning the camper',
    icon: '🔑',
    description: 'Before handing back the keys at The Stable.',
    items: [
      { id: 'grey', label: 'Grey water emptied' },
      { id: 'cassette', label: 'Toilet cassette emptied and rinsed' },
      { id: 'fuel', label: 'Fuel tank full', hint: 'Nearest station is 2 km before the base, on the right.' },
      { id: 'trash', label: 'Rubbish out, fridge emptied' },
      { id: 'damage', label: 'Note any new damage in the app' },
      { id: 'belongings', label: 'Phone chargers, sunglasses, toys — checked every locker' },
    ],
  },
];

export function getChecklist(id: string): ChecklistDefinition | undefined {
  return CHECKLISTS.find((c) => c.id === id);
}
