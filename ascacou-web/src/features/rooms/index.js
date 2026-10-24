import rtk from '@lpr/rtk';
import { createActionsHook } from '@lpr/rtk/react';
import { client } from '../../api';
import { saveOrRefuse } from '../refusals';

const name = 'rooms';
const { createActions } = rtk(name);

const actions = createActions({
  // Ouvre un salon, dont le joueur authentifié est l'hôte ; renvoie son code.
  openRoom: async ({ visibility }) => {
    const room = await saveOrRefuse(client.api('/rooms').create({ visibility }));
    return { code: room.id };
  },
});

export const { openRoom } = actions;
export const useRoomsActions = createActionsHook(actions);
