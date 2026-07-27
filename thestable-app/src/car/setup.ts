import { CarPlay, ListTemplate } from 'react-native-carplay';

import { CATEGORY_ICONS } from '@/core/attractions';
import type { NarrationCandidate } from '@/core/narration';
import { driveSession, type DriveSessionState } from '@/services/driveSession';

/**
 * Android Auto / Apple CarPlay screen: a single list template (car-safe UI)
 * showing narration controls and the attractions within reach. Tapping a row
 * starts/stops the drive session or plays a story immediately. The template
 * observes the same DriveSession as the phone UI, so both stay in sync.
 *
 * Kept deliberately free of React — templates are plain objects pushed to the
 * car's native renderer.
 */

const MAX_NEARBY_ROWS = 6;

type RowAction = () => void;

let template: ListTemplate | null = null;
let rowActions: RowAction[] = [];
let unsubscribe: (() => void) | null = null;

function statusLine(state: DriveSessionState): string {
  switch (state.status) {
    case 'driving':
      return `Live GPS · ${state.playedCount} stories told`;
    case 'simulating':
      return `Demo drive · ${state.playedCount} stories told`;
    case 'locating':
      return 'Getting a GPS fix…';
    case 'denied':
      return 'Location permission needed — allow it on the phone';
    default:
      return 'Not narrating';
  }
}

function candidateDetail(candidate: NarrationCandidate): string {
  const km = Math.round(candidate.distanceKm);
  return candidate.reason === 'near' ? `${km} km · right by you` : `${km} km · on your way`;
}

function buildRows(state: DriveSessionState): {
  items: { id: string; text: string; detailText: string }[];
  actions: RowAction[];
} {
  const items: { id: string; text: string; detailText: string }[] = [];
  const actions: RowAction[] = [];
  const running = state.status === 'driving' || state.status === 'simulating';

  if (state.nowPlaying) {
    items.push({
      id: 'now-playing',
      text: `▶ ${state.nowPlaying.attraction.name}`,
      detailText: 'Now playing — tap to skip',
    });
    actions.push(() => driveSession.skip());
  }

  items.push({
    id: 'toggle-gps',
    text: running && state.status === 'driving' ? 'Stop narration' : 'Start narration (GPS)',
    detailText: statusLine(state),
  });
  actions.push(() => {
    if (driveSession.getState().status === 'driving') driveSession.stop();
    else void driveSession.startGps();
  });

  items.push({
    id: 'toggle-demo',
    text: state.status === 'simulating' ? 'Stop demo drive' : 'Demo drive (Sofia → Tarnovo)',
    detailText: 'Simulated route at 60× speed',
  });
  actions.push(() => {
    if (driveSession.getState().status === 'simulating') driveSession.stop();
    else driveSession.startSimulation();
  });

  for (const candidate of state.upNext.slice(0, MAX_NEARBY_ROWS)) {
    items.push({
      id: candidate.attraction.id,
      text: `${CATEGORY_ICONS[candidate.attraction.category]} ${candidate.attraction.name}`,
      detailText: candidateDetail(candidate),
    });
    actions.push(() => driveSession.play(candidate));
  }

  if (state.upNext.length === 0 && running) {
    items.push({
      id: 'empty',
      text: 'Nothing in range yet',
      detailText: 'Stories appear as you approach attractions',
    });
    actions.push(() => {});
  }

  return { items, actions };
}

function render(state: DriveSessionState) {
  if (!template) return;
  const { items, actions } = buildRows(state);
  rowActions = actions;
  template.updateSections([{ items }]);
}

function onConnect() {
  const { items, actions } = buildRows(driveSession.getState());
  rowActions = actions;

  template = new ListTemplate({
    title: 'The Stable',
    sections: [{ items }],
    onItemSelect: async ({ index }) => {
      rowActions[index]?.();
    },
    backButtonHidden: true,
  });
  CarPlay.setRootTemplate(template);

  unsubscribe?.();
  unsubscribe = driveSession.subscribe(render);
}

function onDisconnect() {
  unsubscribe?.();
  unsubscribe = null;
  template = null;
  rowActions = [];
}

export function setupCarApp(): void {
  CarPlay.registerOnConnect(onConnect);
  CarPlay.registerOnDisconnect(onDisconnect);
  if (CarPlay.connected) onConnect();
}
