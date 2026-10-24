import rtk from '@lpr/rtk';
import { createActionsHook, createSelectorHooks } from '@lpr/rtk/react';
import { client, clientApplication } from '../../api';

// Identité anonyme : un JWT, stocké par spraypaint (localStorage), qui porte l'id du
// joueur (sub). POST /users le crée ; le back le renouvelle dans l'en-tête X-JWT.
const name = 'identity';
const { createActions, createReducer, createSelectors } = rtk(name);

const storedUserId = () => {
  try {
    const jwt = localStorage.getItem(`${clientApplication}-jwt`);
    return jwt ? String(JSON.parse(atob(jwt.split('.')[1])).sub) : null;
  } catch {
    return null;
  }
};

const actions = createActions({
  createIdentity: async ({ name: userName }) => {
    const user = client.api('/users').create({ name: userName });
    if (!(await user.save())) throw new Error(Object.values(user.errors)[0]?.message);
    return { userId: user.id };
  },
});

const reducer = createReducer(
  { userId: storedUserId() },
  {
    [actions.createIdentity.fulfilled]: (state, { payload }) => {
      state.userId = payload.userId;
    },
  }
);

const selectors = createSelectors({
  userId: (state) => state[name].userId,
});

export const { createIdentity } = actions;
export const useIdentityActions = createActionsHook(actions);
export const { selectUserId } = selectors;
export const { useUserId } = createSelectorHooks(selectors);

export default { name, reducer };
