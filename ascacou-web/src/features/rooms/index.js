import rtk from '@lpr/rtk';
import { createActionsHook } from '@lpr/rtk/react';
import { client } from '../../api';

const name = 'rooms';
const { createActions } = rtk(name);

const actions = createActions({
  // Ouvre un salon, dont le joueur authentifié est l'hôte ; renvoie son code.
  openRoom: async ({ visibility }) => {
    const room = client.api('/rooms').create({ visibility });
    if (!(await room.save())) throw new Error(Object.values(room.errors)[0]?.message);
    return { code: room.id };
  },
});

export const { openRoom } = actions;
export const useRoomsActions = createActionsHook(actions);
