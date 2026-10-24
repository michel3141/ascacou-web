import { useState } from 'react';
import { useIdentityActions, useUserId } from '.';

// Le joueur, ou le formulaire qui le crée (pseudo).
export default function Identity() {
  const userId = useUserId();
  const { createIdentity } = useIdentityActions();
  const [name, setName] = useState('');
  if (userId) return <p>Joueur n° {userId}</p>;
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        createIdentity({ name });
      }}>
      <input
        className="flex-1 border px-2 py-1"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Pseudo"
      />
      <button className="border px-3 py-1">Jouer</button>
    </form>
  );
}
