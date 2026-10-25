import { useEffect } from 'react';
import { describe } from '../refusals';
import { useNoticesActions } from '.';

// Erreurs d'un document après une écriture refusée (422 : model.errors) ou échouée
// (réseau, 409 : doc.error) : notifiées une fois, quand elles apparaissent.
export default function useNotifyErrors(errors, error) {
  const { NOTIFY_EVENT: notify } = useNoticesActions();
  const messages = [
    ...Object.values(errors ?? {}).map((e) => describe(e).message),
    ...(error ? [error.message] : []),
  ];
  const key = messages.join('\n');
  useEffect(() => {
    if (key) key.split('\n').forEach(notify);
  }, [key, notify]);
}
