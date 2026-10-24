import { useState } from 'react';
import { useIdentityActions, useUserId } from '.';

// Formulaire qui crée le joueur (pseudo) ; rien une fois identifié (son nom est dans la
// barre du haut).
export default function Identity() {
  const userId = useUserId();
  const { createIdentity } = useIdentityActions();
  const [name, setName] = useState('');
  if (userId) return null;
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        createIdentity({ name });
      }}>
      <input
        className="flex-1 border border-ink rounded-lg px-2 py-1"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Pseudo"
      />
      <button className="btn">Jouer</button>
    </form>
  );
}
