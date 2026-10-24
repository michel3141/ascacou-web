import { createConsumer } from '@rails/actioncable';
import rtk from '@lpr/rtk';
import { createActionsHook } from '@lpr/rtk/react';
import { useEffect } from 'react';
import { client } from '../api';

// Connecteur du cable : ws(s)://<hôte>/cable?token=<jwt>. Le cable annonce, il ne
// transporte pas l'état : chaque message reçu devient un RECEIVED_EVENT, que les
// listeners des features traduisent (rechargement par l'API, présence…).
const name = 'cable';
const { createEvents, createActions } = rtk(name);

// URL recalculée à chaque (re)connexion : JWT courant, géré par spraypaint (renouvelé
// par X-JWT), ou aucun jeton (spectateur anonyme).
const cableUrl = () => {
  const jwt = client.model('users').getJWT();
  return jwt ? `/cable?token=${encodeURIComponent(jwt)}` : '/cable';
};

const consumer = createConsumer(cableUrl);
const subscriptions = new Map(); // identifiant (JSON) => abonnement

const events = createEvents({
  connected: (identifier) => ({ identifier }),
  disconnected: (identifier) => ({ identifier }),
  rejected: (identifier) => ({ identifier }),
  received: (identifier, message) => ({ identifier, message }),
});

const actions = createActions({
  // Abonnement à un canal ; renvoie la fonction de désabonnement. `ping` : intervalle
  // (ms) du signe de vie attendu par le canal (RoomChannel : 30 s).
  subscribe: (identifier, options) => (dispatch) => {
    const ping = options?.ping;
    const key = JSON.stringify(identifier);
    const subscription = consumer.subscriptions.create(identifier, {
      connected: () => dispatch(events.CONNECTED_EVENT(identifier)),
      disconnected: () => dispatch(events.DISCONNECTED_EVENT(identifier)),
      rejected: () => dispatch(events.REJECTED_EVENT(identifier)),
      received: (message) => dispatch(events.RECEIVED_EVENT(identifier, message)),
    });
    subscriptions.set(key, subscription);
    const timer = ping && setInterval(() => subscription.perform('ping'), ping);
    return () => {
      clearInterval(timer);
      subscriptions.delete(key);
      subscription.unsubscribe();
    };
  },

  // Action d'un canal (say…), sur un abonnement en cours.
  perform: (identifier, action, data) => () => {
    subscriptions.get(JSON.stringify(identifier))?.perform(action, data);
  },

  // Reconnexion avec le jeton courant (identité créée) ; les abonnements sont repris.
  reconnect: () => () => consumer.connection.reopen(),
});

export const { CONNECTED_EVENT, DISCONNECTED_EVENT, REJECTED_EVENT, RECEIVED_EVENT } = events;
export const { subscribe, perform, reconnect } = actions;
export const useCableActions = createActionsHook(actions);

// Abonnement le temps du montage du composant ; `identifier` nul : pas d'abonnement.
export function useChannel(identifier, options) {
  const { subscribe: subscribeChannel } = useCableActions();
  const key = identifier && JSON.stringify([identifier, options]);
  useEffect(() => {
    if (!key) return undefined;
    const [id, opts] = JSON.parse(key);
    return subscribeChannel(id, opts);
  }, [key, subscribeChannel]);
}
