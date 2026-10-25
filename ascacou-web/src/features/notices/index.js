import rtk, { addListener } from '@lpr/rtk';
import { createActionsHook, createSelectorHooks } from '@lpr/rtk/react';

// Notifications brèves, posées sous la barre du haut : surtout les refus du serveur à
// une action (course avec l'adversaire, salon qui a changé…). Les erreurs de saisie,
// elles, restent sous leur champ.
const name = 'notices';
const { createEvents, createReducer, createSelectors } = rtk(name);

let next = 0;

const events = createEvents({
  notify: (message) => ({ id: ++next, message }),
  dismiss: (id) => ({ id }),
});

const reducer = createReducer([], {
  [events.NOTIFY_EVENT]: (state, { payload }) => [...state.slice(-2), payload],
  [events.DISMISS_EVENT]: (state, { payload }) => state.filter(({ id }) => id !== payload.id),
});

const selectors = createSelectors({
  notices: (state) => state[name],
});

// Tout refus d'une intention de l'interface (jeu, salons, identité) devient une
// notification : son message est déjà traduit (features/refusals).
const FEATURES = ['game/', 'rooms/', 'identity/'];
const listeners = [
  addListener(
    ({ type }) => type.endsWith('/rejected') && FEATURES.some((f) => type.startsWith(f)),
    ({ error }, { dispatch }) => dispatch(events.NOTIFY_EVENT(error?.message ?? 'Action refusée.'))
  ),
];

export const { NOTIFY_EVENT, DISMISS_EVENT } = events;
export const useNoticesActions = createActionsHook(events);
export const { useNotices } = createSelectorHooks(selectors);

export default { name, reducer, listeners };
