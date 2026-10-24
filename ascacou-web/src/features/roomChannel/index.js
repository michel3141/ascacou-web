import rtk, { addListener } from '@lpr/rtk';
import { createSelectorHooks } from '@lpr/rtk/react';
import { RECEIVED_EVENT, perform } from '../../cable';

// État d'un salon tenu par le RoomChannel seul (rien n'est rechargé par l'API) :
// joueurs présents, nombre de spectateurs, partie en cours.
const name = 'roomChannel';
const { createReducer, createSelectors } = rtk(name);

const emptyRoom = { present: [], viewers: 0, gameId: null };

const reducer = createReducer(
  {},
  {
    [RECEIVED_EVENT]: (state, { payload: { identifier, message } }) => {
      if (identifier.channel !== 'RoomChannel') return;
      const room = (state[identifier.code] ??= { ...emptyRoom });
      switch (message.type) {
        case 'sync':
          room.present = message.present.map(String);
          room.viewers = message.viewers;
          room.gameId = message.game ? String(message.game.id) : null;
          break;
        case 'game':
          room.gameId = String(message.game.id);
          break;
        case 'presence': {
          const id = String(message.user_id);
          room.present = room.present.filter((other) => other !== id);
          if (message.present) room.present.push(id);
          break;
        }
        case 'viewers':
          room.viewers = message.count;
          break;
      }
    },
  }
);

const selectors = createSelectors({
  roomChannel: (state, code) => state[name][code] ?? emptyRoom,
});

// Signe de vie immédiat, sans attendre le ping périodique :
//  - le salon a changé : on vient peut-être de le rejoindre (le serveur fait alors du
//    spectateur un joueur présent) ;
//  - on nous annonce absent alors qu'on est là : un autre de nos onglets s'est fermé.
const listeners = [
  addListener(RECEIVED_EVENT, ({ payload: { identifier, message } }, { dispatch, getState }) => {
    if (identifier.channel !== 'RoomChannel') return;
    const me = getState().identity.userId;
    const absentMe =
      message.type === 'presence' && !message.present && String(message.user_id) === me;
    if (message.type === 'room' || absentMe) dispatch(perform(identifier, 'ping'));
  }),
];

export const { selectRoomChannel } = selectors;
export const { useRoomChannel } = createSelectorHooks(selectors);

export default { name, reducer, listeners };
