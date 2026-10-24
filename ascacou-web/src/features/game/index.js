import rtk from '@lpr/rtk';
import { createActionsHook } from '@lpr/rtk/react';
import { client } from '../../api';
import { Refused, refusal, saveOrRefuse } from '../refusals';
import { reloadGame } from '../sync';

// Intentions de jeu : chacune crée une resource (coup, pioche, partie), puis recharge la
// partie sans attendre l'annonce du cable (qui sera ignorée, même version).
const name = 'game';
const { createActions } = rtk(name);

const actions = createActions({
  // nextColor : variante pion imposé, couleur imposée à l'adversaire.
  playMove: async ({ gameId, rank, coord, color, nextColor }, { dispatch }) => {
    await saveOrRefuse(
      client.api('/moves').create({ gameId: Number(gameId), rank, coord, color, nextColor })
    );
    await dispatch(reloadGame({ id: gameId }));
    return { gameId, coord, color };
  },
  pickCard: async ({ gameId, card, hand }, { dispatch }) => {
    await saveOrRefuse(client.api('/picks').create({ gameId: Number(gameId), card, hand }));
    await dispatch(reloadGame({ id: gameId }));
    return { gameId, card, hand };
  },
  // Accepter l'annulation demandée : DELETE du dernier coup.
  acceptTakeback: async ({ gameId }, { dispatch }) => {
    const { data } = await client
      .api('/moves')
      .index.where({ game_id: gameId })
      .order({ rank: 'desc' })
      .per(1)
      .all();
    const [move] = data;
    if (move && !(await move.destroy())) throw new Refused(refusal(move));
    await dispatch(reloadGame({ id: gameId }));
    return { gameId };
  },
  nextGame: async ({ roomCode }) => {
    const game = await saveOrRefuse(client.api('/games').create({ roomId: roomCode }));
    return { gameId: game.id };
  },
});

export const { playMove, pickCard, acceptTakeback, nextGame } = actions;
export const useGameActions = createActionsHook(actions);
