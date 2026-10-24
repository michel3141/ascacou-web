import rtk from '@lpr/rtk';
import { createActionsHook } from '@lpr/rtk/react';
import { client } from '../../api';
import { saveOrRefuse } from '../refusals';
import { reloadGame } from '../sync';

// Intentions de jeu : chacune crée une resource (coup, pioche, partie), puis recharge la
// partie sans attendre l'annonce du cable (qui sera ignorée, même version).
const name = 'game';
const { createActions } = rtk(name);

const actions = createActions({
  playMove: async ({ gameId, rank, coord, color }, { dispatch }) => {
    await saveOrRefuse(client.api('/moves').create({ gameId: Number(gameId), rank, coord, color }));
    await dispatch(reloadGame({ id: gameId }));
    return { gameId, coord, color };
  },
  pickCard: async ({ gameId, card, hand }, { dispatch }) => {
    await saveOrRefuse(client.api('/picks').create({ gameId: Number(gameId), card, hand }));
    await dispatch(reloadGame({ id: gameId }));
    return { gameId, card, hand };
  },
  nextGame: async ({ roomCode }) => {
    const game = await saveOrRefuse(client.api('/games').create({ roomId: roomCode }));
    return { gameId: game.id };
  },
});

export const { playMove, pickCard, nextGame } = actions;
export const useGameActions = createActionsHook(actions);
