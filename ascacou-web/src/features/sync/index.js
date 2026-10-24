import rtk, { addListener } from '@lpr/rtk';
import { CREATE_EVENT } from '@lpr/redux-documents/actions';
import { client } from '../../api';
import { RECEIVED_EVENT } from '../../cable';

// Le cable annonce, l'API recharge : une annonce plus récente que ce qu'on a déclenche
// un find ; spraypaint met à jour les instances suivies et redux-documents rafraîchit
// leurs vues (SYNC => REFRESH).
const name = 'sync';
const { createActions, createReducer } = rtk(name);

const actions = createActions({
  reloadGame: async ({ id }) => {
    const { data } = await client.api('/games').show.find(id);
    return { id: data.id, version: data.lockVersion };
  },
  reloadRoom: async ({ code }) => {
    const { data } = await client.api('/rooms').show.find(code);
    return { code: data.id };
  },
});

// Dernière version chargée de chaque partie (lock_version).
const reducer = createReducer(
  { gameVersions: {} },
  {
    [actions.reloadGame.fulfilled]: (state, { payload }) => {
      state.gameVersions[payload.id] = payload.version;
    },
  }
);

const { reloadGame, reloadRoom } = actions;

// Une partie n'est rechargée que si l'annonce est plus récente (ou si elle est inconnue).
const gameAnnounced = (game, { dispatch, getState }) => {
  if (!game) return;
  const known = getState()[name].gameVersions[game.id];
  if (known === undefined || game.version > known) dispatch(reloadGame({ id: game.id }));
};

const roomChannel = ({ type, room, game }, api) => {
  switch (type) {
    case 'sync': // (re)connexion : état courant
      api.dispatch(reloadRoom({ code: room.id }));
      gameAnnounced(game, api);
      break;
    case 'room':
      api.dispatch(reloadRoom({ code: room.id }));
      break;
    case 'game':
      gameAnnounced(game, api);
      break;
  }
};

// Un salon listé a changé : les listes de salons (Index, shouldRefresh 'create' sur
// rooms) se rechargent ; celles qui le contenaient déjà sont aussi resynchronisées.
const lobbyChannel = ({ type, id }, { dispatch }) => {
  if (type === 'room') dispatch(CREATE_EVENT({ resourceIdentifier: { type: 'rooms', id } }));
};

const listeners = [
  addListener(RECEIVED_EVENT, ({ payload: { identifier, message } }, api) => {
    if (identifier.channel === 'RoomChannel') roomChannel(message, api);
    if (identifier.channel === 'LobbyChannel') lobbyChannel(message, api);
  }),
];

export { reloadGame, reloadRoom };
export default { name, reducer, listeners };
